"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, AlertCircle } from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000"

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [rememberMe, setRememberMe] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setIsLoading(true);
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    // Save JWT for session
    localStorage.setItem("token", data.token);
    // Redirect based on role
    switch (data.role) {
      case "admin":
        router.push("/admin/dashboard");
        break;
      case "doctor":
        router.push("/doctor/dashboard");
        break;
      default:
        router.push("/patient/appointments");
    }
  } catch (err: any) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};

        if (!email || !password) {
            setError("Please enter both email and password")
            setIsLoading(false)
            return
        }

        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data?.error ?? "Unable to sign in. Please try again.")
                setIsLoading(false)
                return
            }

            const { token, user } = data ?? {}
            if (token) {
                localStorage.setItem("authToken", token)
            }
            if (user) {
                localStorage.setItem("authUser", JSON.stringify(user))
            }

            const role = user?.role?.toLowerCase()
            if (role === "doctor") {
                router.push("/doctor/appointments")
            } else if (role === "staff") {
                router.push("/staff/appointments")
            } else {
                router.push("/patient/appointments")
            }
        } catch (err) {
            console.error("Login failed", err)
            setError("Unexpected error. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
            <div className="w-full max-w-md">

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <Calendar className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-semibold mb-2">Welcome Back</h1>
                    <p className="text-muted-foreground">Sign in to access your clinic account</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Sign In</CardTitle>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                            <div className="mt-4">
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Signing in..." : "Sign In"}
                                </Button>
                            </div>
                        </CardContent>
                    </form>
                </Card>
            </div>
        </div>
    )
}
