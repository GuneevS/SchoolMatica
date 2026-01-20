"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { WizardValues, STAFF_ROLES } from "./wizard-types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, Mail, UserPlus, Info } from "lucide-react";

export function StepStaff() {
    const { control, watch, register, formState: { errors } } = useFormContext<WizardValues>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "staffInvites",
    });

    const staffInvites = watch("staffInvites") || [];

    const addStaff = () => {
        append({
            email: "",
            firstName: "",
            lastName: "",
            role: "teacher",
        });
    };

    // Count by role
    const roleCounts = staffInvites.reduce((acc, invite) => {
        acc[invite.role] = (acc[invite.role] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="space-y-6 py-4">
            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    Staff members will receive email invitations to join the school platform.
                    You can skip this step and add staff later.
                </AlertDescription>
            </Alert>

            {/* Staff List */}
            <div className="space-y-3 max-h-[250px] overflow-y-auto">
                {fields.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-8 text-center">
                            <UserPlus className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-4">
                                No staff members added yet
                            </p>
                            <Button type="button" onClick={addStaff} variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Staff Member
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    fields.map((field, index) => (
                        <Card key={field.id} className="border">
                            <CardContent className="py-3 px-4">
                                <div className="grid grid-cols-12 gap-3 items-end">
                                    <div className="col-span-3">
                                        <Label className="text-xs">First Name</Label>
                                        <Input
                                            {...register(`staffInvites.${index}.firstName`)}
                                            placeholder="John"
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <Label className="text-xs">Last Name</Label>
                                        <Input
                                            {...register(`staffInvites.${index}.lastName`)}
                                            placeholder="Smith"
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <Label className="text-xs">Email</Label>
                                        <Input
                                            {...register(`staffInvites.${index}.email`)}
                                            type="email"
                                            placeholder="john@school.edu"
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="text-xs">Role</Label>
                                        <Select
                                            value={staffInvites[index]?.role || "teacher"}
                                            onValueChange={(value) => {
                                                const newInvites = [...staffInvites];
                                                newInvites[index] = { ...newInvites[index], role: value as any };
                                            }}
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {STAFF_ROLES.map(role => (
                                                    <SelectItem key={role.value} value={role.value}>
                                                        {role.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-destructive hover:text-destructive"
                                            onClick={() => remove(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Add Button */}
            {fields.length > 0 && (
                <Button type="button" onClick={addStaff} variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Staff Member
                </Button>
            )}

            {/* Summary */}
            {staffInvites.length > 0 && (
                <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                        <strong className="text-foreground">{staffInvites.length}</strong> staff member{staffInvites.length !== 1 ? "s" : ""} to invite
                    </div>
                    <div className="flex gap-2">
                        {Object.entries(roleCounts).map(([role, count]) => {
                            const roleInfo = STAFF_ROLES.find(r => r.value === role);
                            return (
                                <Badge key={role} variant="secondary" className="text-xs">
                                    {count} {roleInfo?.label || role}
                                </Badge>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
