"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Server,
  Plus,
  ExternalLink,
  Trash2,
  Edit,
  Activity,
  HardDrive,
  Cpu,
  MemoryStick,
  Globe,
  Thermometer,
  RefreshCw,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

interface Service {
  id: string
  name: string
  url: string
  status: "online" | "offline" | "warning"
  responseTime?: number
  createdAt: string
}

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

export default function ServerDashboard() {
  const [services, setServices] = useState<Service[]>([])
  const [serverStats, setServerStats] = useState<ServerStats | null>(null)
  const [newService, setNewService] = useState({ name: "", url: "" })
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingServices, setIsCheckingServices] = useState(false)
  const { toast } = useToast()
  const [showDiskDetail, setShowDiskDetail] = useState(false)

  // 获取服务列表
  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services")
      if (response.ok) {
        const data = await response.json()
        setServices(data)
      }
    } catch (error) {
      toast({
        title: "错误",
        description: "获取服务列表失败",
        variant: "destructive",
      })
    }
  }

  // 获取服务器状态
  const fetchServerStats = async () => {
    try {
      const response = await fetch("/api/server-stats")
      if (response.ok) {
        const data = await response.json()
        setServerStats(data)
      }
    } catch (error) {
      toast({
        title: "错误",
        description: "获取服务器状态失败",
        variant: "destructive",
      })
    }
  }

  // 检查所有服务状态
  const checkAllServices = async () => {
    setIsCheckingServices(true)
    try {
      const response = await fetch("/api/services/check", {
        method: "POST",
      })
      if (response.ok) {
        const data = await response.json()
        setServices(data)
        toast({
          title: "成功",
          description: "服务状态检查完成",
        })
      }
    } catch (error) {
      toast({
        title: "错误",
        description: "检查服务状态失败",
        variant: "destructive",
      })
    } finally {
      setIsCheckingServices(false)
    }
  }

  // 添加服务
  const addService = async () => {
    if (!newService.name || !newService.url) {
      toast({
        title: "错误",
        description: "请填写服务名称和URL",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newService),
      })

      if (response.ok) {
        const newServiceData = await response.json()
        setServices([...services, newServiceData])
        setNewService({ name: "", url: "" })
        setIsAddDialogOpen(false)
        toast({
          title: "成功",
          description: "服务添加成功",
        })
      } else {
        throw new Error("Failed to add service")
      }
    } catch (error) {
      toast({
        title: "错误",
        description: "添加服务失败",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 更新服务
  const updateService = async () => {
    if (!editingService) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/services", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingService),
      })

      if (response.ok) {
        const updatedService = await response.json()
        setServices(services.map((service) => (service.id === updatedService.id ? updatedService : service)))
        setEditingService(null)
        setIsEditDialogOpen(false)
        toast({
          title: "成功",
          description: "服务更新成功",
        })
      } else {
        throw new Error("Failed to update service")
      }
    } catch (error) {
      toast({
        title: "错误",
        description: "更新服务失败",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 删除服务
  const deleteService = async (id: string) => {
    try {
      const response = await fetch(`/api/services?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setServices(services.filter((service) => service.id !== id))
        toast({
          title: "成功",
          description: "服务删除成功",
        })
      } else {
        throw new Error("Failed to delete service")
      }
    } catch (error) {
      toast({
        title: "错误",
        description: "删除服务失败",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "offline":
        return "bg-red-500"
      case "warning":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "在线"
      case "offline":
        return "离线"
      case "warning":
        return "警告"
      default:
        return "未知"
    }
  }

  const getTempColor = (temp: number) => {
    if (temp > 80) return "text-red-500"
    if (temp > 70) return "text-yellow-500"
    return "text-green-500"
  }

  useEffect(() => {
    fetchServices()
    fetchServerStats()

    // 每30秒更新一次服务器状态
    const statsInterval = setInterval(fetchServerStats, 30000)

    return () => {
      clearInterval(statsInterval)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">服务器监控面板</h1>
            <p className="text-muted-foreground">管理你的服务器和服务状态</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={checkAllServices} disabled={isCheckingServices}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isCheckingServices ? "animate-spin" : ""}`} />
              检查状态
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  添加服务
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>添加新服务</DialogTitle>
                  <DialogDescription>添加一个新的服务到监控列表中</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">服务名称</Label>
                    <Input
                      id="name"
                      value={newService.name}
                      onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                      placeholder="输入服务名称"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="url">服务URL</Label>
                    <Input
                      id="url"
                      value={newService.url}
                      onChange={(e) => setNewService({ ...newService, url: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={addService} disabled={isLoading}>
                    {isLoading ? "添加中..." : "添加服务"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 服务器监控信息 */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* 大块：CPU详细、内存详细、磁盘简要 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPU 详细信息</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div><span className="font-semibold">型号：</span>{serverStats?.cpuModel || '未知'}</div>
                <div><span className="font-semibold">物理核心：</span>{serverStats?.cpuCores || 0} 核</div>
                <div><span className="font-semibold">线程数：</span>{serverStats?.cpuThreads || 0} 线程</div>
                <div><span className="font-semibold">主频：</span>{serverStats?.cpuSpeed ? serverStats.cpuSpeed.toFixed(2) : 0} GHz</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">内存详细信息</CardTitle>
              <MemoryStick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div><span className="font-semibold">型号：</span>{serverStats?.memoryModel || '未知'}</div>
                <div><span className="font-semibold">频率：</span>{serverStats?.memorySpeed || 0} MHz</div>
                <div><span className="font-semibold">总大小：</span>{serverStats?.memoryTotal ? (serverStats.memoryTotal / 1024 / 1024 / 1024).toFixed(2) : 0} GB</div>
                <div><span className="font-semibold">已用大小：</span>{serverStats?.memoryUsed ? (serverStats.memoryUsed / 1024 / 1024 / 1024).toFixed(2) : 0} GB</div>
              </div>
            </CardContent>
          </Card>

          {/* 磁盘简要信息卡片，点击下钻弹窗 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">磁盘信息</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(serverStats?.disks || []).slice(0, 2).map((disk, idx) => (
                  <div key={disk.name + idx} className="flex items-center justify-between">
                    <span className="font-semibold">{disk.diskModel || '未知'}</span>
                    <span>{(disk.total / 1024 / 1024 / 1024).toFixed(2)} GB</span>
                  </div>
                ))}
                {serverStats?.diskCount > 2 && <div className="text-xs text-muted-foreground">仅显示前两块硬盘</div>}
                <Button variant="outline" className="mt-2 w-full" onClick={() => setShowDiskDetail(true)}>
                  查看全部硬盘详情
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 硬盘详情弹窗 */}
        <Dialog open={showDiskDetail} onOpenChange={setShowDiskDetail}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>全部硬盘详细信息</DialogTitle>
            </DialogHeader>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border mt-2">
                <thead>
                  <tr>
                    <th className="px-2 py-1 border">名称/挂载点</th>
                    <th className="px-2 py-1 border">类型</th>
                    <th className="px-2 py-1 border">型号</th>
                    <th className="px-2 py-1 border">总大小</th>
                    <th className="px-2 py-1 border">已用</th>
                    <th className="px-2 py-1 border">可用</th>
                    <th className="px-2 py-1 border">使用率</th>
                  </tr>
                </thead>
                <tbody>
                  {serverStats?.disks?.map((disk, idx) => (
                    <tr key={disk.name + idx}>
                      <td className="px-2 py-1 border">{disk.name}</td>
                      <td className="px-2 py-1 border">{disk.type}</td>
                      <td className="px-2 py-1 border">{disk.diskModel || '未知'}</td>
                      <td className="px-2 py-1 border">{(disk.total / 1024 / 1024 / 1024).toFixed(2)} GB</td>
                      <td className="px-2 py-1 border">{(disk.used / 1024 / 1024 / 1024).toFixed(2)} GB</td>
                      <td className="px-2 py-1 border">{(disk.free / 1024 / 1024 / 1024).toFixed(2)} GB</td>
                      <td className="px-2 py-1 border">{disk.percent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>

        {/* 小块：使用率等，自适应布局 */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPU 使用率</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{serverStats?.cpu || 0}%</div>
              <Progress value={serverStats?.cpu || 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPU 温度</CardTitle>
              <Thermometer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getTempColor(serverStats?.cpuTemp || 0)}`}>{serverStats?.cpuTemp || 0}°C</div>
              <Progress value={Math.min(((serverStats?.cpuTemp || 0) / 100) * 100, 100)} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">内存使用率</CardTitle>
              <MemoryStick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{serverStats?.memory || 0}%</div>
              <Progress value={serverStats?.memory || 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">磁盘使用率</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{serverStats?.disk || 0}%</div>
              <Progress value={serverStats?.disk || 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">网络流量</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{serverStats?.network || 0} MB/s</div>
              <p className="text-xs text-muted-foreground mt-1">运行时间: {serverStats?.uptime || "获取中..."}</p>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* 服务列表 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold tracking-tight">服务列表</h2>
            <Badge variant="secondary">{`${services.length} 个服务`}</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(service.status)}`} />
                      <Badge
                        variant={
                          service.status === "online"
                            ? "default"
                            : service.status === "warning"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {getStatusText(service.status)}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {service.url}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {service.responseTime && <span>响应时间: {service.responseTime}ms</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => window.open(service.url, "_blank")}>
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingService(service)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>
                              你确定要删除服务 "{service.name}" 吗？此操作无法撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteService(service.id)}>删除</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {services.length === 0 && (
            <Card className="p-8 text-center">
              <Server className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">暂无服务</h3>
              <p className="text-muted-foreground mb-4">点击上方的"添加服务"按钮来添加你的第一个服务</p>
            </Card>
          )}
        </div>

        {/* 编辑服务对话框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑服务</DialogTitle>
              <DialogDescription>修改服务的名称和URL</DialogDescription>
            </DialogHeader>
            {editingService && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">服务名称</Label>
                  <Input
                    id="edit-name"
                    value={editingService.name}
                    onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-url">服务URL</Label>
                  <Input
                    id="edit-url"
                    value={editingService.url}
                    onChange={(e) => setEditingService({ ...editingService, url: e.target.value })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={updateService} disabled={isLoading}>
                {isLoading ? "保存中..." : "保存更改"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
