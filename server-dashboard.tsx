"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Server, Plus, ExternalLink, Trash2, Edit, Activity, HardDrive, Cpu, MemoryStick, Globe } from "lucide-react"
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

interface Service {
  id: string
  name: string
  url: string
  status: "online" | "offline" | "warning"
  responseTime?: number
}

export default function Component() {
  const [services, setServices] = useState<Service[]>([
    {
      id: "1",
      name: "API 服务",
      url: "https://api.example.com",
      status: "online",
      responseTime: 120,
    },
    {
      id: "2",
      name: "前端应用",
      url: "https://app.example.com",
      status: "online",
      responseTime: 85,
    },
    {
      id: "3",
      name: "数据库监控",
      url: "https://db.example.com",
      status: "warning",
      responseTime: 350,
    },
  ])

  const [newService, setNewService] = useState({ name: "", url: "" })
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // 模拟服务器监控数据
  const serverStats = {
    cpu: 45,
    memory: 68,
    disk: 32,
    network: 15.6,
    uptime: "15天 8小时",
  }

  const addService = () => {
    if (newService.name && newService.url) {
      const service: Service = {
        id: Date.now().toString(),
        name: newService.name,
        url: newService.url,
        status: Math.random() > 0.3 ? "online" : "offline",
        responseTime: Math.floor(Math.random() * 500) + 50,
      }
      setServices([...services, service])
      setNewService({ name: "", url: "" })
      setIsAddDialogOpen(false)
    }
  }

  const updateService = () => {
    if (editingService) {
      setServices(services.map((service) => (service.id === editingService.id ? editingService : service)))
      setEditingService(null)
      setIsEditDialogOpen(false)
    }
  }

  const deleteService = (id: string) => {
    setServices(services.filter((service) => service.id !== id))
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

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">服务器监控面板</h1>
            <p className="text-muted-foreground">管理你的服务器和服务状态</p>
          </div>
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
                <Button onClick={addService}>添加服务</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* 服务器监控信息 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPU 使用率</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{serverStats.cpu}%</div>
              <Progress value={serverStats.cpu} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">内存使用率</CardTitle>
              <MemoryStick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{serverStats.memory}%</div>
              <Progress value={serverStats.memory} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">磁盘使用率</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{serverStats.disk}%</div>
              <Progress value={serverStats.disk} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">网络流量</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{serverStats.network} MB/s</div>
              <p className="text-xs text-muted-foreground mt-1">运行时间: {serverStats.uptime}</p>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* 服务列表 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold tracking-tight">服务列表</h2>
            <Badge variant="secondary">{services.length} 个服务</Badge>
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
              <Button onClick={updateService}>保存更改</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
