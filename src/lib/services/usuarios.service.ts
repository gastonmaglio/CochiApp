import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase/config";
import type { Usuario } from "@/types/usuario";

const COLECCION = "usuarios";

export async function asegurarUsuario(user: User, nombreOverride?: string): Promise<void> {
  const ref = doc(db, COLECCION, user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    if (nombreOverride) {
      const actual = snap.data() as Omit<Usuario, "uid">;
      if (actual.nombre !== nombreOverride) {
        await updateDoc(ref, { nombre: nombreOverride, actualizadoEn: serverTimestamp() });
      }
    }
    return;
  }

  // OJO: nunca escribir "householdId" acá. Esta función se llama desde más de un lugar
  // al iniciar sesión (el flujo de registro/Google Y, como red de seguridad, un efecto
  // reactivo en AuthContext) y ambas llamadas pueden correr en paralelo la primera vez.
  // Si alguna llegara a crear el doc DESPUÉS de que crearHousehold/unirseHousehold ya
  // seteó el household, un setDoc con householdId acá lo pisaría de vuelta a null. Como
  // ese campo solo lo tocan crearHousehold/unirseHousehold (con updateDoc, nunca acá),
  // no hay forma de que una carrera entre llamadas rompa la vinculación al hogar.
  await setDoc(
    ref,
    {
      nombre: nombreOverride ?? user.displayName ?? user.email?.split("@")[0] ?? "Usuario",
      email: user.email ?? "",
      fotoUrl: user.photoURL ?? null,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    },
    { merge: true }
  );
}
