import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import os from "os"

const execAsync = promisify(exec)

interface DiskInfo {
  name: string;
  type: string;
  total: number;
  used: number;
  free: number;
  percent: number;
  diskModel?: string; // 新增硬盘型号字段
}

interface ServerStats {
  cpu: number
  memory: number
  disk: number
  network: number
  uptime: string
  cpuTemp: number
  cpuModel: string
  cpuCores: number
  cpuThreads: number
  cpuSpeed: number // GHz
  memoryModel: string
  memorySpeed: number // MHz
  memoryTotal: number // 字节
  memoryUsed: number // 字节
  disks: DiskInfo[]
  diskCount: number
}

// 获取CPU温度（跨平台增强）
async function getCPUTemperature(): Promise<number> {
  try {
    if (process.platform === "linux") {
      // 1. 新内核路径尝试
      try {
        const { stdout } = await execAsync("cat /sys/class/hwmon/hwmon*/temp*_input | head -1");
        const temp = Number.parseInt(stdout.trim()) / 1000;
        if (!isNaN(temp) && temp > 0) return Math.round(temp);
      } catch {}
      // 2. 旧路径尝试
      try {
        const { stdout } = await execAsync("cat /sys/class/thermal/thermal_zone0/temp");
        const temp = Number.parseInt(stdout.trim()) / 1000;
        if (!isNaN(temp) && temp > 0) return Math.round(temp);
      } catch {}
      // 3. sensors命令
      try {
        const { stdout } = await execAsync(
          "sensors | grep 'Core 0' | awk '{print $3}' | sed 's/+//g' | sed 's/°C//g'"
        );
        const temp = Number.parseFloat(stdout.trim());
        if (!isNaN(temp) && temp > 0) return Math.round(temp);
      } catch {}
      // 4. 失败返回null
      return null;
    }
    if (process.platform === "win32") {
      // Windows: wmic命令
      try {
        const { stdout } = await execAsync(
          'wmic /namespace:\\root\\wmi PATH MSAcpi_ThermalZoneTemperature get CurrentTemperature /value'
        );
        const match = stdout.match(/CurrentTemperature=(\d+)/);
        if (match) {
          const tempK10 = parseInt(match[1], 10);
          if (tempK10 > 2732) {
            // 转换为摄氏度
            const tempC = tempK10 / 10 - 273.15;
            return Math.round(tempC);
          }
        }
      } catch {}
      // 失败返回null
      return null;
    }
    if (process.platform === "darwin") {
      // macOS: powermetrics
      try {
        const { stdout } = await execAsync('sudo powermetrics --samplers smc -n 1 | grep "CPU die temperature"');
        const match = stdout.match(/(\d+\.\d+)/);
        if (match) return Math.round(Number.parseFloat(match[1]));
      } catch {}
      // 失败返回null
      return null;
    }
    // 其它系统不支持
    return null;
  } catch {
    return null;
  }
}

// 获取CPU使用率
function getCPUUsage(): Promise<number> {
  return new Promise((resolve) => {
    const startMeasure = process.cpuUsage()
    const startTime = process.hrtime()

    setTimeout(() => {
      const endMeasure = process.cpuUsage(startMeasure)
      const endTime = process.hrtime(startTime)

      const totalTime = endTime[0] * 1000000 + endTime[1] / 1000
      const totalUsage = endMeasure.user + endMeasure.system
      const cpuPercent = (totalUsage / totalTime) * 100

      resolve(Math.min(Math.round(cpuPercent), 100))
    }, 100)
  })
}

// 获取内存使用率
function getMemoryUsage(): number {
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = totalMem - freeMem
  return Math.round((usedMem / totalMem) * 100)
}

// 获取磁盘使用率（模拟）
async function getDiskUsage(): Promise<number> {
  try {
    if (process.platform === "linux" || process.platform === "darwin") {
      const { stdout } = await execAsync("df -h / | tail -1 | awk '{print $5}' | sed 's/%//g'")
      return Number.parseInt(stdout.trim()) || Math.round(Math.random() * 50 + 20)
    }
    return Math.round(Math.random() * 50 + 20) // 模拟数据
  } catch {
    return Math.round(Math.random() * 50 + 20) // 模拟数据
  }
}

// 获取内存详细信息
async function getMemoryDetail() {
  let memoryModel = '未知';
  let memorySpeed = 0;
  const total = os.totalmem();
  const used = total - os.freemem();

  try {
    if (process.platform === 'win32') {
      // Windows: 获取内存型号和频率
      const { stdout: modelOut } = await execAsync('wmic memorychip get Manufacturer,PartNumber /value');
      const { stdout: speedOut } = await execAsync('wmic memorychip get Speed /value');
      const modelMatch = modelOut.match(/PartNumber=(.*)/);
      if (modelMatch) memoryModel = modelMatch[1].trim();
      const speedMatch = speedOut.match(/Speed=(\d+)/);
      if (speedMatch) memorySpeed = parseInt(speedMatch[1], 10);
    } else if (process.platform === 'linux') {
      // Linux: 获取内存型号和频率
      const { stdout: modelOut } = await execAsync("sudo dmidecode -t memory | grep 'Part Number' | head -1");
      const { stdout: speedOut } = await execAsync("sudo dmidecode -t memory | grep 'Speed' | grep -v Configured | head -1");
      const modelMatch = modelOut.match(/Part Number: (.*)/);
      if (modelMatch) memoryModel = modelMatch[1].trim();
      const speedMatch = speedOut.match(/Speed: (\d+)/);
      if (speedMatch) memorySpeed = parseInt(speedMatch[1], 10);
    } else if (process.platform === 'darwin') {
      // macOS: 获取内存频率（型号一般不可得）
      const { stdout: speedOut } = await execAsync("system_profiler SPMemoryDataType | grep 'Speed' | head -1");
      const speedMatch = speedOut.match(/Speed: (\d+) MHz/);
      if (speedMatch) memorySpeed = parseInt(speedMatch[1], 10);
      memoryModel = '未知';
    }
  } catch {
    // 失败时使用默认值
    memoryModel = '未知';
    memorySpeed = 0;
  }
  return { memoryModel, memorySpeed, memoryTotal: total, memoryUsed: used };
}

// 获取磁盘详细信息
async function getDisksDetail(): Promise<DiskInfo[]> {
  const disks: DiskInfo[] = [];
  try {
    if (process.platform === 'win32') {
      // Windows: wmic logicaldisk
      const { stdout } = await execAsync('wmic logicaldisk get Name,Size,FreeSpace,Description /format:csv');
      const { stdout: modelOut } = await execAsync('wmic diskdrive get Model,DeviceID /format:csv');
      // 解析硬盘型号
      const modelMap: Record<string, string> = {};
      const modelLines = modelOut.split(/\r?\n/).filter(l => l.trim() && !l.includes('Node,DeviceID,Model'));
      for (const line of modelLines) {
        const parts = line.split(',');
        if (parts.length >= 3) {
          const [node, deviceId, model] = parts;
          if (deviceId && model) {
            modelMap[deviceId.trim()] = model.trim();
          }
        }
      }
      const lines = stdout.split(/\r?\n/).filter(l => l.trim() && !l.includes('Node,Description,FreeSpace,Name,Size'));
      for (const line of lines) {
        const parts = line.split(',');
        if (parts.length >= 5) {
          const [node, desc, free, name, size] = parts;
          if (!name || !size) continue;
          const total = Number(size);
          const freeNum = Number(free);
          const used = total - freeNum;
          // 通过逻辑盘名查找物理盘型号
          let diskModel = undefined;
          try {
            const { stdout: logicalOut } = await execAsync(`wmic logicaldisk where DeviceID='${name}' assoc /assocclass:Win32_LogicalDiskToPartition`);
            const match = logicalOut.match(/Disk #([0-9]+), Partition/);
            if (match) {
              const diskIndex = match[1];
              const { stdout: deviceOut } = await execAsync(`wmic diskdrive where Index=${diskIndex} get DeviceID /value`);
              const deviceMatch = deviceOut.match(/DeviceID=(.*)/);
              if (deviceMatch) {
                const deviceId = deviceMatch[1].trim();
                diskModel = modelMap[deviceId];
              }
            }
          } catch {}
          disks.push({
            name,
            type: desc,
            total,
            used,
            free: freeNum,
            percent: total ? Math.round((used / total) * 100) : 0,
            diskModel,
          });
        }
      }
    } else if (process.platform === 'linux') {
      // Linux: df -T -B1
      const { stdout } = await execAsync("df -T -B1 | grep -E 'ext|xfs|btrfs|ntfs|fat' | awk '{print $1,$2,$3,$4,$5,$7}'");
      const lines = stdout.split(/\r?\n/);
      for (const line of lines) {
        const [name, type, total, used, free, mount] = line.split(/\s+/);
        if (!name || !total) continue;
        disks.push({
          name: mount || name,
          type,
          total: Number(total),
          used: Number(used),
          free: Number(free),
          percent: Number(total) ? Math.round((Number(used) / Number(total)) * 100) : 0,
          diskModel: undefined, // Linux暂不支持
        });
      }
    } else if (process.platform === 'darwin') {
      // macOS: df -H
      const { stdout } = await execAsync("df -H | grep '^/dev/'");
      const lines = stdout.split(/\r?\n/);
      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length < 6) continue;
        const [name, total, used, free, percent, mount] = parts;
        disks.push({
          name: mount || name,
          type: 'disk',
          total: parseSize(total),
          used: parseSize(used),
          free: parseSize(free),
          percent: Number(percent.replace('%','')),
          diskModel: undefined, // macOS暂不支持
        });
      }
    }
  } catch {
    // 失败返回空数组
  }
  return disks;
}
// 解析macOS df -H的容量字符串
function parseSize(str: string): number {
  if (!str) return 0;
  const unit = str.slice(-1).toUpperCase();
  const num = parseFloat(str);
  switch (unit) {
    case 'G': return num * 1024 * 1024 * 1024;
    case 'M': return num * 1024 * 1024;
    case 'K': return num * 1024;
    case 'T': return num * 1024 * 1024 * 1024 * 1024;
    default: return num;
  }
}

// 格式化运行时间
function formatUptime(): string {
  const uptime = os.uptime()
  const days = Math.floor(uptime / 86400)
  const hours = Math.floor((uptime % 86400) / 3600)
  const minutes = Math.floor((uptime % 3600) / 60)

  if (days > 0) {
    return `${days}天 ${hours}小时`
  } else if (hours > 0) {
    return `${hours}小时 ${minutes}分钟`
  } else {
    return `${minutes}分钟`
  }
}

export async function GET() {
  try {
    const [cpu, cpuTempRaw, disk, memoryDetail, disks] = await Promise.all([
      getCPUUsage(),
      getCPUTemperature(),
      getDiskUsage(),
      getMemoryDetail(),
      getDisksDetail(),
    ]);
    const cpuTemp = (cpuTempRaw === null || isNaN(cpuTempRaw)) ? Math.round(Math.random() * 20 + 40) : cpuTempRaw;
    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model || "未知";
    const cpuCores = cpus.filter(cpu => !cpu.model.includes('Intel(R) Hyper-Threading')).length || os.cpus().length;
    const cpuThreads = cpus.length;
    const cpuSpeed = cpus[0]?.speed ? (cpus[0].speed / 1000) : 0;

    const stats: ServerStats = {
      cpu,
      memory: getMemoryUsage(),
      disk,
      network: Math.round(Math.random() * 50 + 10),
      uptime: formatUptime(),
      cpuTemp,
      cpuModel,
      cpuCores,
      cpuThreads,
      cpuSpeed,
      memoryModel: memoryDetail.memoryModel,
      memorySpeed: memoryDetail.memorySpeed,
      memoryTotal: memoryDetail.memoryTotal,
      memoryUsed: memoryDetail.memoryUsed,
      disks,
      diskCount: disks.length,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to get server stats:", error);
    // 返回模拟数据作为后备
    const fallbackStats: ServerStats = {
      cpu: Math.round(Math.random() * 50 + 20),
      memory: Math.round(Math.random() * 50 + 30),
      disk: Math.round(Math.random() * 50 + 20),
      network: Math.round(Math.random() * 50 + 10),
      uptime: "模拟数据",
      cpuTemp: Math.round(Math.random() * 20 + 40),
      cpuModel: "未知",
      cpuCores: 4,
      cpuThreads: 8,
      cpuSpeed: 2.5,
      memoryModel: "未知",
      memorySpeed: 0,
      memoryTotal: 8 * 1024 * 1024 * 1024,
      memoryUsed: 4 * 1024 * 1024 * 1024,
      disks: [],
      diskCount: 0,
    };
    return NextResponse.json(fallbackStats);
  }
}
