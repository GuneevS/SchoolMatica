
"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

export function LoginForm() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setError(null);

        const result = await signIn("credentials", {
            email: values.email,
            password: values.password,
            redirect: false,
            callbackUrl: callbackUrl,
        });

        // Note: signIn with redirect:true usually handles the navigation, 
        // but if it fails it might not throw.
        if (result?.error) {
            setError("Invalid credentials. Please try again.");
            setIsLoading(false);
        } else {
            // Successful login, redirect
            window.location.href = callbackUrl;
        }
    }

    return (
        <Card className="w-[350px]">
            <CardHeader>
                <CardTitle>SchoolMatica</CardTitle>
                <CardDescription>Sign in to access your school dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="grid w-full items-center gap-4">
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                placeholder="teacher@school.com"
                                {...form.register("email")}
                                disabled={isLoading}
                            />
                            {form.formState.errors.email && (
                                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                            )}
                        </div>
                        <div className="flex flex-col space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs text-muted-foreground hover:text-primary"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                {...form.register("password")}
                                disabled={isLoading}
                            />
                            {form.formState.errors.password && (
                                <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                            )}
                        </div>
                    </div>
                    {error && (
                        <div className="mt-4 text-sm text-red-500">
                            {error}
                        </div>
                    )}
                    <Button className="w-full mt-6" type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Sign In
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-4">
                <p className="text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="text-primary hover:underline font-medium">
                        Register your school
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
