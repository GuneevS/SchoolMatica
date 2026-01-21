import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * School Registration API
 * 
 * Creates a new school and its initial administrator account.
 * This is the entry point for new schools to join SchoolMatica.
 * 
 * The admin user is automatically assigned the School Administrator role
 * and all permissions for their school.
 */

const registrationSchema = z.object({
  // School details
  schoolName: z.string().min(2, "School name must be at least 2 characters"),
  schoolShortCode: z.string().min(2).max(10).optional(),
  
  // Admin user details
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 requests per hour per IP
    const identifier = getClientIdentifier(request);
    const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.AUTH_REGISTER);

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many registration attempts. Please try again later.",
          retryAfter: rateLimit.reset,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimit.limit.toString(),
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
            "X-RateLimit-Reset": rateLimit.reset.toString(),
            "Retry-After": rateLimit.reset.toString(),
          },
        }
      );
    }

    const body = await request.json();
    const parsed = registrationSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map(i => ({ field: i.path[0], message: i.message })) },
        { status: 400 }
      );
    }
    
    const { schoolName, schoolShortCode, firstName, lastName, email, password } = parsed.data;
    
    // Check if email already exists
    const existingUser = await prisma.appUser.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }
    
    // Check if school short code already exists (if provided)
    if (schoolShortCode) {
      const existingSchool = await prisma.school.findUnique({
        where: { shortCode: schoolShortCode },
      });
      
      if (existingSchool) {
        return NextResponse.json(
          { error: "A school with this short code already exists" },
          { status: 409 }
        );
      }
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Get or create the default grading config
      let gradingConfig = await tx.gradingConfig.findFirst({
        where: { name: "FET Default" },
      });
      
      if (!gradingConfig) {
        gradingConfig = await tx.gradingConfig.create({
          data: {
            name: "FET Default",
            phasesJson: {
              FET: [
                { min: 80, code: 7, label: "Outstanding" },
                { min: 70, code: 6, label: "Meritorious" },
                { min: 60, code: 5, label: "Substantial" },
                { min: 50, code: 4, label: "Adequate" },
                { min: 40, code: 3, label: "Moderate" },
                { min: 30, code: 2, label: "Elementary" },
                { min: 0, code: 1, label: "Not Achieved" },
              ],
            },
          },
        });
      }
      
      // Create the school
      const school = await tx.school.create({
        data: {
          name: schoolName,
          shortCode: schoolShortCode || generateShortCode(schoolName),
          gradingConfigId: gradingConfig.id,
        },
      });
      
      // Get or create the School Administrator role
      const adminRoleKey = "school_admin";
      let adminRole = await tx.roleDefinition.findUnique({
        where: { key: adminRoleKey },
      });
      
      if (!adminRole) {
        // Create the School Administrator role with all school-level permissions
        adminRole = await tx.roleDefinition.create({
          data: {
            key: adminRoleKey,
            name: "School Administrator",
            description: "Full administrative access to a specific school",
            priority: 100, // High priority for admin role
          },
        });
        
        // Get all permission definitions
        const allPermissions = await tx.permissionDefinition.findMany();
        
        // Create role permissions for admin role (all permissions)
        if (allPermissions.length > 0) {
          await tx.rolePermission.createMany({
            data: allPermissions.map((perm) => ({
              roleId: adminRole!.id,
              permissionId: perm.id,
            })),
          });
        }
      }
      
      // Create the admin user
      const fullName = `${firstName} ${lastName}`;
      const user = await tx.appUser.create({
        data: {
          email,
          passwordHash,
          name: fullName,
          displayName: fullName,
          schoolId: school.id, // Associate user with the new school
          roleAssignments: {
            create: {
              roleId: adminRole.id,
              scopeSchoolId: school.id,
            },
          },
        },
        include: {
          roleAssignments: {
            include: {
              role: true,
            },
          },
        },
      });
      
      return { school, user };
    });
    
    return NextResponse.json({
      success: true,
      message: "Registration successful",
      school: {
        id: result.school.id,
        name: result.school.name,
        shortCode: result.school.shortCode,
      },
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        displayName: result.user.displayName,
      },
    }, { status: 201 });
    
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * Generate a short code from school name
 * Takes first letters of each word, uppercase
 */
function generateShortCode(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  let code = words.map(w => w[0]).join("").toUpperCase();
  
  // Ensure minimum length of 2
  if (code.length < 2) {
    code = name.substring(0, 3).toUpperCase();
  }
  
  // Add random suffix to ensure uniqueness
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${code}${randomSuffix}`.substring(0, 10);
}
