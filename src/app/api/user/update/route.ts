import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

// Configuración
const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 6;
const MAX_NAME_LENGTH = 100;

interface UpdateNameBody {
  type: "name";
  name: string;
}

interface UpdatePasswordBody {
  type: "password";
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

type UpdateBody = UpdateNameBody | UpdatePasswordBody;

export async function PUT(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado. Debes iniciar sesión." },
        { status: 401 }
      );
    }

    const body: UpdateBody = await request.json();

    // Actualizar nombre
    if (body.type === "name") {
      const { name } = body;

      // Validaciones
      if (!name || typeof name !== "string") {
        return NextResponse.json(
          { error: "El nombre es requerido" },
          { status: 400 }
        );
      }

      const trimmedName = name.trim();

      if (trimmedName.length === 0) {
        return NextResponse.json(
          { error: "El nombre no puede estar vacío" },
          { status: 400 }
        );
      }

      if (trimmedName.length > MAX_NAME_LENGTH) {
        return NextResponse.json(
          { error: `El nombre no puede exceder ${MAX_NAME_LENGTH} caracteres` },
          { status: 400 }
        );
      }

      // Actualizar en la base de datos
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: { name: trimmedName },
        select: { id: true, name: true, email: true },
      });

      return NextResponse.json({
        success: true,
        message: "Nombre actualizado correctamente",
        user: updatedUser,
      });
    }

    // Actualizar contraseña
    if (body.type === "password") {
      const { currentPassword, newPassword, confirmPassword } = body;

      // Validaciones
      if (!currentPassword || !newPassword || !confirmPassword) {
        return NextResponse.json(
          { error: "Todos los campos son requeridos" },
          { status: 400 }
        );
      }

      if (newPassword !== confirmPassword) {
        return NextResponse.json(
          { error: "Las contraseñas nuevas no coinciden" },
          { status: 400 }
        );
      }

      if (newPassword.length < MIN_PASSWORD_LENGTH) {
        return NextResponse.json(
          { error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` },
          { status: 400 }
        );
      }

      // Obtener usuario actual con su contraseña
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { password: true },
      });

      if (!user) {
        return NextResponse.json(
          { error: "Usuario no encontrado" },
          { status: 404 }
        );
      }

      // Verificar contraseña actual
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: "La contraseña actual es incorrecta" },
          { status: 400 }
        );
      }

      // Verificar que la nueva contraseña sea diferente
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return NextResponse.json(
          { error: "La nueva contraseña debe ser diferente a la actual" },
          { status: 400 }
        );
      }

      // Hashear y actualizar la nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

      await prisma.user.update({
        where: { id: session.user.id },
        data: { password: hashedPassword },
      });

      return NextResponse.json({
        success: true,
        message: "Contraseña actualizada correctamente",
      });
    }

    return NextResponse.json(
      { error: "Tipo de actualización no válido" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
