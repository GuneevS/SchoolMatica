"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { WizardValues } from "./wizard-types";
import { School, MapPin, Phone, Mail } from "lucide-react";

export function StepIdentity() {
    const { register, formState: { errors }, watch } = useFormContext<WizardValues>();
    const name = watch("name");
    const shortCode = watch("shortCode");

    return (
        <div className="space-y-6 py-4">
            {/* Preview Card */}
            {name && (
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardContent className="py-4 flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                            <School className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">{name}</h3>
                            {shortCode && (
                                <p className="text-sm text-muted-foreground font-mono">{shortCode.toUpperCase()}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Form Fields */}
            <div className="grid gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                        <School className="h-4 w-4" />
                        School Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="name"
                        placeholder="e.g. Northview High School"
                        {...register("name")}
                        className="text-lg"
                    />
                    {errors.name && (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="shortCode">Short Code</Label>
                        <Input
                            id="shortCode"
                            placeholder="e.g. NVH"
                            {...register("shortCode")}
                            className="uppercase font-mono"
                            maxLength={10}
                        />
                        <p className="text-xs text-muted-foreground">Used for prefixes</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5" />
                            Phone
                        </Label>
                        <Input
                            id="phone"
                            placeholder="+27 11 123 4567"
                            {...register("phone")}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        School Email
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="info@school.edu.za"
                        {...register("email")}
                    />
                    {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="address" className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" />
                        Address
                    </Label>
                    <Textarea
                        id="address"
                        placeholder="123 Main Road, Suburb, City, 2000"
                        {...register("address")}
                        rows={2}
                    />
                </div>
            </div>
        </div>
    );
}
