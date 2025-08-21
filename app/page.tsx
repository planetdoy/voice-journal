"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import {
  Mic,
  Target,
  TrendingUp,
  Brain,
  Star,
  Play,
  CheckCircle,
  ArrowRight,
  Menu,
  X,
  Sunrise,
  Moon,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// 대시보드 컴포넌트 임포트 (가정)
import Dashboard from "@/components/dashboard"

export default function VoiceJournalLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  // Removed unused form states since we only use Google login
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState<"landing" | "dashboard">("landing")
  
  // NextAuth 세션 가져오기
  const { data: session, status } = useSession()
  const isLoggedIn = !!session
  const user = session?.user ? { 
    name: session.user.name || "사용자", 
    email: session.user.email || "",
    image: session.user.image || undefined
  } : null

  // 부드러운 스크롤 함수 추가
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
    setIsMenuOpen(false) // 모바일에서 메뉴 닫기
  }

  const goToDashboard = () => {
    setCurrentPage("dashboard")
  }

  const goToLanding = () => {
    setCurrentPage("landing")
  }

  // 구글 로그인
  const handleGoogleLogin = async () => {
    try {
      await signIn('google', { callbackUrl: '/' })
    } catch (error) {
      console.error('로그인 오류:', error)
    }
  }

  // 이메일 로그인 처리 (추후 구현)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    alert('이메일 로그인은 준비중입니다. 구글 로그인을 이용해주세요.')
  }

  // Removed handleSignup since we only use Google login

  // 로그아웃 처리
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
    setCurrentPage("landing")
  }

  // 로그인 상태에 따라 대시보드로 자동 이동
  useEffect(() => {
    if (status === "loading") return
    if (isLoggedIn && currentPage === "landing") {
      setCurrentPage("dashboard")
    }
  }, [isLoggedIn, status, currentPage])

  const features = [
    {
      icon: <Moon className="w-8 h-8 text-purple-600" />,
      title: "밤의 계획 세우기",
      description: "하루를 마무리하며 내일의 목표와 계획을 음성으로 녹음하세요. 생각이 정리되고 의지가 강해집니다.",
    },
    {
      icon: <Sunrise className="w-8 h-8 text-orange-500" />,
      title: "아침의 동기부여",
      description: "일어나자마자 어젯밤 내 목소리로 녹음한 계획을 들어보세요. 실행 의지가 2배 강해집니다.",
    },
    {
      icon: <Brain className="w-8 h-8 text-blue-600" />,
      title: "깊은 회고와 성찰",
      description: "하루를 돌아보며 성장 포인트를 음성으로 기록하세요. 패턴을 발견하고 더 나은 내일을 만들어가세요.",
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-green-600" />,
      title: "성장 추적",
      description: "목표 달성률과 성장 패턴을 시각화하여 확인하세요. 작은 변화가 큰 성장으로 이어집니다.",
    },
  ]

  const testimonials = [
    {
      name: "김서연",
      role: "직장인, 6개월 사용",
      content:
        "매일 밤 내일 계획을 녹음하고 아침에 듣기 시작한 후, 목표 달성률이 30%에서 85%로 올랐어요. 내 목소리의 힘이 이렇게 클 줄 몰랐습니다.",
      avatar: "/placeholder.svg?height=40&width=40",
      achievement: "목표 달성률 85%",
    },
    {
      name: "이준혁",
      role: "창업가, 1년 사용",
      content:
        "회고 습관이 생기면서 같은 실수를 반복하지 않게 되었어요. 매주 성장하는 제 모습을 음성으로 확인할 수 있어서 정말 뿌듯합니다.",
      avatar: "/placeholder.svg?height=40&width=40",
      achievement: "습관 형성 100일 달성",
    },
    {
      name: "박민지",
      role: "대학생, 3개월 사용",
      content:
        "시험 기간에 매일 계획을 세우고 회고하면서 성적이 크게 올랐어요. 무엇보다 스스로에 대한 믿음이 생겼습니다.",
      avatar: "/placeholder.svg?height=40&width=40",
      achievement: "학점 3.2 → 3.8 상승",
    },
  ]

  const stats = [
    { number: "87%", label: "목표 달성률 향상" },
    { number: "2.3배", label: "실행력 증가" },
    { number: "95%", label: "사용자 만족도" },
    { number: "21일", label: "평균 습관 형성 기간" },
  ]


  return (
    <div className="min-h-screen bg-white">
      {currentPage === "landing" ? (
        <>
          {/* Navigation */}
          <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <Mic className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">Speak Log</h1>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8">
                  <button
                    onClick={() => scrollToSection("how-it-works")}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    성장 방법
                  </button>
                  <button
                    onClick={() => scrollToSection("features")}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    기능
                  </button>
                  <button
                    onClick={() => scrollToSection("success-stories")}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    성공 사례
                  </button>
                  <button
                    onClick={() => scrollToSection("pricing")}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    요금제
                  </button>

                  {isLoggedIn ? (
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">안녕하세요, {user?.name}님!</span>
                      <Button variant="outline" onClick={handleLogout}>
                        로그아웃
                      </Button>
                      <Button className="bg-gradient-to-r from-purple-600 to-blue-600" onClick={goToDashboard}>
                        대시보드
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline">로그인</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>로그인</DialogTitle>
                            <DialogDescription>Speak Log에 로그인하여 성장 여정을 시작하세요.</DialogDescription>
                          </DialogHeader>
                          <div className="py-6">
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              onClick={handleGoogleLogin}
                            >
                              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                <path
                                  fill="#4285F4"
                                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                  fill="#34A853"
                                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                  fill="#FBBC05"
                                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                  fill="#EA4335"
                                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                              </svg>
                              Google로 계속하기
                            </Button>
                            
                            <p className="text-sm text-gray-500 text-center mt-4">
                              Google 계정으로 로그인하여 Speak Log을 시작하세요.
                              <br />
                              별도의 회원가입은 필요하지 않습니다.
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button 
                        className="bg-gradient-to-r from-purple-600 to-blue-600"
                        onClick={handleGoogleLogin}
                      >
                        무료로 성장 시작
                      </Button>
                    </div>
                  )}
                </div>

                {/* Mobile menu button */}
                <div className="md:hidden">
                  <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </Button>
                </div>
              </div>

              {/* Mobile Navigation */}
              {isMenuOpen && (
                <div className="md:hidden border-t bg-white">
                  <div className="px-2 pt-2 pb-3 space-y-1">
                    <button
                      onClick={() => scrollToSection("how-it-works")}
                      className="block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900"
                    >
                      성장 방법
                    </button>
                    <button
                      onClick={() => scrollToSection("features")}
                      className="block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900"
                    >
                      기능
                    </button>
                    <button
                      onClick={() => scrollToSection("success-stories")}
                      className="block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900"
                    >
                      성공 사례
                    </button>
                    <button
                      onClick={() => scrollToSection("pricing")}
                      className="block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900"
                    >
                      요금제
                    </button>

                    {isLoggedIn ? (
                      <div className="flex flex-col gap-2 px-3 pt-2">
                        <p className="text-sm text-gray-600">안녕하세요, {user?.name}님!</p>
                        <Button variant="outline" className="w-full bg-transparent" onClick={handleLogout}>
                          로그아웃
                        </Button>
                        <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600" onClick={goToDashboard}>
                          대시보드
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 px-3 pt-2">
                        <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full bg-transparent">
                              로그인
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>로그인</DialogTitle>
                              <DialogDescription>Speak Log에 로그인하여 성장 여정을 시작하세요.</DialogDescription>
                            </DialogHeader>
                            <div className="py-6">
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={handleGoogleLogin}
                              >
                                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                  <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                  />
                                  <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                  />
                                  <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                  />
                                  <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                  />
                                </svg>
                                Google로 계속하기
                              </Button>
                              
                              <p className="text-sm text-gray-500 text-center mt-4">
                                Google 계정으로 로그인하여 Speak Log을 시작하세요.
                                <br />
                                별도의 회원가입은 필요하지 않습니다.
                              </p>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button 
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
                          onClick={handleGoogleLogin}
                        >
                          무료로 성장 시작
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Hero Section */}
          <section className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center space-y-8">
                <div className="space-y-6">
                  <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                    🎯 과학적으로 입증된 목표 달성 방법
                  </Badge>
                  <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
                    내 목소리가 만드는
                    <br />
                    <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      매일의 성장
                    </span>
                  </h1>
                  <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                    매일 밤 내일의 계획을 음성으로 녹음하고, 아침에 내 목소리로 들어보세요.
                    <br />
                    <strong className="text-purple-600">목표 달성률이 2배 이상 높아집니다.</strong>
                    <br />
                    회고와 계획을 통해 매일 조금씩, 하지만 확실하게 성장하세요.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    size="lg"
                    className="text-lg px-8 py-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    onClick={handleGoogleLogin}
                  >
                    <Target className="w-5 h-5 mr-2" />
                    무료로 성장 시작하기
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="text-lg px-8 py-6 bg-transparent"
                    onClick={() => scrollToSection("success-stories")}
                  >
                    <Play className="w-5 h-5 mr-2" />
                    성장 스토리 보기
                  </Button>
                </div>

                <div className="pt-8">
                  <p className="text-sm text-gray-500 mb-6">이미 많은 분들이 성장하고 있습니다</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, index) => (
                      <div key={index} className="text-center">
                        <div className="text-3xl font-bold text-purple-600">{stat.number}</div>
                        <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How it works */}
          <section id="how-it-works" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center space-y-4 mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">왜 내 목소리일까요?</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  연구에 따르면 자신의 목소리로 들은 계획은{" "}
                  <strong className="text-purple-600">실행률이 2.3배 높습니다.</strong>
                  <br />
                  뇌과학적으로 자기 목소리는 더 강한 동기부여와 책임감을 만들어냅니다.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Moon className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">밤 9시, 내일을 계획하세요</h3>
                      <p className="text-gray-600">
                        하루를 마무리하며 내일의 목표와 우선순위를 음성으로 녹음합니다. 생각이 정리되고 의지가
                        명확해집니다.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Sunrise className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">아침 7시, 내 목소리를 들으세요</h3>
                      <p className="text-gray-600">
                        일어나자마자 어젯밤 녹음한 계획을 재생합니다. 내 목소리가 주는 강력한 동기부여로 하루를
                        시작하세요.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Brain className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">밤 10시, 하루를 회고하세요</h3>
                      <p className="text-gray-600">
                        무엇을 잘했고, 무엇을 개선할지 솔직하게 기록합니다. 패턴을 발견하고 더 나은 내일을 만들어가세요.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl p-8">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                      <BarChart3 className="w-10 h-10 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">21일 후 당신의 변화</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">목표 달성률</span>
                        <span className="font-bold text-purple-600">87% ↑</span>
                      </div>
                      <Progress value={87} className="h-2" />

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">자기 효능감</span>
                        <span className="font-bold text-blue-600">92% ↑</span>
                      </div>
                      <Progress value={92} className="h-2" />

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">습관 형성률</span>
                        <span className="font-bold text-green-600">78% ↑</span>
                      </div>
                      <Progress value={78} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center space-y-4 mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">개인 맞춤 성장 도구</h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  단순한 기록이 아닌, 당신만의 성장 패턴을 발견하고 가속화하는 도구입니다.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {features.map((feature, index) => (
                  <Card
                    key={index}
                    className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <CardHeader>
                      <div className="mx-auto mb-4">{feature.icon}</div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Success Stories */}
          <section id="success-stories" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center space-y-4 mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">실제 성장 스토리</h2>
                <p className="text-xl text-gray-600">
                  Speak Log과 함께 목표를 달성하고 꿈을 이룬 사람들의 이야기입니다.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {testimonials.map((testimonial, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-gray-600 mb-4 leading-relaxed">"{testimonial.content}"</p>
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 mb-4">
                        <div className="text-sm font-semibold text-purple-600">성과</div>
                        <div className="text-lg font-bold text-gray-900">{testimonial.achievement}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={testimonial.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{testimonial.name}</p>
                          <p className="text-sm text-gray-500">{testimonial.role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>


          {/* CTA Section */}
          <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <div className="space-y-8">
                <h2 className="text-3xl md:text-4xl font-bold text-white">오늘부터 달라지세요</h2>
                <p className="text-xl text-purple-100 max-w-3xl mx-auto">
                  매일 밤 3분의 계획, 매일 아침 1분의 듣기로 인생이 바뀝니다.
                  <br />
                  <strong className="text-white">21일 후, 완전히 다른 당신을 만나보세요.</strong>
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6"
                    onClick={handleGoogleLogin}
                  >
                    <Target className="w-5 h-5 mr-2" />
                    무료로 시작하기
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
                <p className="text-sm text-purple-200">무료로 시작하기 • 언제든 취소 가능 • 1분 가입</p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-gray-900 text-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-4 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                      <Mic className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold">Speak Log</h3>
                  </div>
                  <p className="text-gray-400">내 목소리로 만드는 매일의 성장, 개인 맞춤 자기계발 플랫폼</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">성장 도구</h4>
                  <ul className="space-y-2 text-gray-400">
                    <li>
                      <a href="#" className="hover:text-white transition-colors">
                        계획 세우기
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-white transition-colors">
                        회고하기
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-white transition-colors">
                        성장 분석
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">지원</h4>
                  <ul className="space-y-2 text-gray-400">
                    <li>
                      <a href="#" className="hover:text-white transition-colors">
                        성장 가이드
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-white transition-colors">
                        커뮤니티
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-white transition-colors">
                        문의하기
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">회사</h4>
                  <ul className="space-y-2 text-gray-400">
                    <li>
                      <a href="#" className="hover:text-white transition-colors">
                        미션
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-white transition-colors">
                        성장 스토리
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-white transition-colors">
                        채용
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
                <p>&copy; 2024 Speak Log. 모든 성장의 순간을 함께합니다.</p>
              </div>
            </div>
          </footer>
        </>
      ) : (
        <Dashboard user={user} onBackToLanding={goToLanding} onLogout={handleLogout} />
      )}
    </div>
  )
}
