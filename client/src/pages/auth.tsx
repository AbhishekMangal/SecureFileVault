import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { FaGoogle, FaGithub } from "react-icons/fa";

// Login schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

// Registration schema
const registrationSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  terms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions",
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registrationSchema>;

export default function Auth() {
  const { login, register, isLoading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  // Registration form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });
  
  // Handle login form submission
  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      await login(data.username, data.password);
    } catch (error) {
      console.error("Login error:", error);
    }
  };
  
  // Handle registration form submission
  const onRegisterSubmit = async (data: RegisterFormValues) => {
    try {
      await register(data);
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Auth form side */}
      <div className="flex flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:w-1/2 xl:w-2/5">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <div className="flex items-center">
              <svg 
                className="h-10 w-auto text-blue-600" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M14 14V8L19 4M10 14V8L5 4M12 14V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 20V14L12 20L19 14V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h2 className="ml-2 text-2xl font-bold text-gray-900">SecureTransfer</h2>
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              {showRegister ? "Create your account" : "Sign in to your account"}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {showRegister ? "Already have an account? " : "Or "}
              <Button 
                variant="link" 
                className="font-medium text-blue-600 hover:text-blue-500 p-0"
                onClick={() => setShowRegister(!showRegister)}
              >
                {showRegister ? "Sign in" : "create a new account"}
              </Button>
            </p>
          </div>

          <div className="mt-8">
            {/* Login Form */}
            {!showRegister && (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your username" 
                            {...field} 
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Enter your password" 
                            {...field} 
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex items-center justify-between">
                    <FormField
                      control={loginForm.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormLabel className="text-sm cursor-pointer">Remember me</FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      variant="link" 
                      className="font-medium text-blue-600 hover:text-blue-500 p-0"
                      disabled={isLoading}
                    >
                      Forgot your password?
                    </Button>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </Form>
            )}

            {/* Registration Form */}
            {showRegister && (
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={registerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your first name" 
                              {...field} 
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your last name" 
                              {...field} 
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Choose a username" 
                            {...field} 
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email address</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Enter your email" 
                            {...field} 
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Create a password" 
                            {...field} 
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Confirm your password" 
                            {...field} 
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="terms"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm cursor-pointer">
                            I agree to the{" "}
                            <Button 
                              variant="link" 
                              className="font-medium text-blue-600 hover:text-blue-500 p-0"
                              disabled={isLoading}
                            >
                              Terms
                            </Button>
                            {" "}and{" "}
                            <Button 
                              variant="link" 
                              className="font-medium text-blue-600 hover:text-blue-500 p-0"
                              disabled={isLoading}
                            >
                              Privacy Policy
                            </Button>
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create account"}
                  </Button>
                </form>
              </Form>
            )}

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button variant="outline" className="w-full" disabled={isLoading}>
                  <FaGoogle className="mr-2 h-4 w-4 text-red-500" />
                  Google
                </Button>

                <Button variant="outline" className="w-full" disabled={isLoading}>
                  <FaGithub className="mr-2 h-4 w-4 text-gray-800" />
                  GitHub
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Auth background side */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 bg-center bg-cover" style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80')" 
        }}>
          <div className="absolute inset-0 bg-gray-900 opacity-70"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="max-w-md text-center text-white">
              <h1 className="text-4xl font-bold">Secure File Transfer</h1>
              <p className="mt-4 text-xl">State-of-the-art encryption to keep your files safe and private during transfer.</p>
              <div className="mt-8 flex justify-center space-x-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">256-bit</div>
                  <div className="text-sm text-gray-300">Encryption</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">SHA-256</div>
                  <div className="text-sm text-gray-300">File Integrity</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">RSA</div>
                  <div className="text-sm text-gray-300">Key Security</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
