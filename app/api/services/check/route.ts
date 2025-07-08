import { NextResponse } from "next/server"
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

async function checkServiceStatus(url: string): Promise<{ status: Service["status"]; responseTime: number }> {
  try {
    const startTime = Date.now()
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
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

export async function POST() {
  try {
    const data = await fs.readFile(dataFilePath, "utf8")
    const services: Service[] = JSON.parse(data)

    // 并行检查所有服务状态
    const updatedServices = await Promise.all(
      services.map(async (service) => {
        const { status, responseTime } = await checkServiceStatus(service.url)
        return {
          ...service,
          status,
          responseTime,
        }
      }),
    )

    await fs.writeFile(dataFilePath, JSON.stringify(updatedServices, null, 2))

    return NextResponse.json(updatedServices)
  } catch (error) {
    return NextResponse.json({ error: "Failed to check services" }, { status: 500 })
  }
}
