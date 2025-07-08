import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

interface Service {
  id: string
  name: string
  url: string
  status: "online" | "offline" | "warning"
  responseTime?: number
  createdAt: string
}

const dataFilePath = path.join(process.cwd(), "data", "services.json")

// 确保数据目录存在
async function ensureDataDir() {
  const dataDir = path.dirname(dataFilePath)
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// 读取服务数据
async function readServices(): Promise<Service[]> {
  try {
    await ensureDataDir()
    const data = await fs.readFile(dataFilePath, "utf8")
    return JSON.parse(data)
  } catch {
    // 如果文件不存在，返回默认数据
    const defaultServices: Service[] = [
      {
        id: "1",
        name: "API 服务",
        url: "https://api.example.com",
        status: "online",
        responseTime: 120,
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        name: "前端应用",
        url: "https://app.example.com",
        status: "online",
        responseTime: 85,
        createdAt: new Date().toISOString(),
      },
      {
        id: "3",
        name: "数据库监控",
        url: "https://db.example.com",
        status: "warning",
        responseTime: 350,
        createdAt: new Date().toISOString(),
      },
    ]
    await writeServices(defaultServices)
    return defaultServices
  }
}

// 写入服务数据
async function writeServices(services: Service[]) {
  await ensureDataDir()
  await fs.writeFile(dataFilePath, JSON.stringify(services, null, 2))
}

// 检查服务状态
async function checkServiceStatus(url: string): Promise<{ status: Service["status"]; responseTime: number }> {
  try {
    const startTime = Date.now()
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000), // 5秒超时
    })
    const responseTime = Date.now() - startTime

    if (response.ok) {
      return {
        status: responseTime > 1000 ? "warning" : "online",
        responseTime,
      }
    } else {
      return { status: "offline", responseTime }
    }
  } catch {
    return { status: "offline", responseTime: 0 }
  }
}

export async function GET() {
  try {
    const services = await readServices()
    return NextResponse.json(services)
  } catch (error) {
    return NextResponse.json({ error: "Failed to read services" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, url } = await request.json()

    if (!name || !url) {
      return NextResponse.json({ error: "Name and URL are required" }, { status: 400 })
    }

    const services = await readServices()
    const { status, responseTime } = await checkServiceStatus(url)

    const newService: Service = {
      id: Date.now().toString(),
      name,
      url,
      status,
      responseTime,
      createdAt: new Date().toISOString(),
    }

    services.push(newService)
    await writeServices(services)

    return NextResponse.json(newService, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, url } = await request.json()

    if (!id || !name || !url) {
      return NextResponse.json({ error: "ID, name and URL are required" }, { status: 400 })
    }

    const services = await readServices()
    const serviceIndex = services.findIndex((s) => s.id === id)

    if (serviceIndex === -1) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    const { status, responseTime } = await checkServiceStatus(url)

    services[serviceIndex] = {
      ...services[serviceIndex],
      name,
      url,
      status,
      responseTime,
    }

    await writeServices(services)
    return NextResponse.json(services[serviceIndex])
  } catch (error) {
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const services = await readServices()
    const filteredServices = services.filter((s) => s.id !== id)

    if (filteredServices.length === services.length) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    await writeServices(filteredServices)
    return NextResponse.json({ message: "Service deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 })
  }
}
