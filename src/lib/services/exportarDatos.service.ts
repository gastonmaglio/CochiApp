import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

/**
 * Junta TODO lo que hay guardado del hogar (no solo gastos, a diferencia del CSV de
 * Resumen) en un solo objeto para que el usuario se lo pueda llevar. Son todas lecturas
 * puntuales (getDocs), no listeners — se arma una vez, al tocar el botón.
 */
export async function exportarDatosHousehold(householdId: string): Promise<Record<string, unknown>> {
  const householdRef = doc(db, "households", householdId);

  const [
    householdSnap,
    listasSnap,
    gastosSnap,
    recurrentesSnap,
    tareasSnap,
    comprasCerradasSnap,
    categoriasComprasSnap,
    categoriasGastosSnap,
  ] = await Promise.all([
    getDoc(householdRef),
    getDocs(collection(householdRef, "listas")),
    getDocs(collection(householdRef, "gastos")),
    getDocs(collection(householdRef, "gastosRecurrentes")),
    getDocs(collection(householdRef, "tareas")),
    getDocs(collection(householdRef, "comprasCerradas")),
    getDocs(collection(householdRef, "categoriasCompras")),
    getDocs(collection(householdRef, "categoriasGastos")),
  ]);

  const listas = await Promise.all(
    listasSnap.docs.map(async (listaDoc) => {
      const itemsSnap = await getDocs(collection(listaDoc.ref, "items"));
      return {
        id: listaDoc.id,
        ...listaDoc.data(),
        items: itemsSnap.docs.map((itemDoc) => ({ id: itemDoc.id, ...itemDoc.data() })),
      };
    })
  );

  const aPlano = (snap: typeof gastosSnap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return {
    exportadoEn: new Date().toISOString(),
    hogar: householdSnap.exists() ? { id: householdSnap.id, ...householdSnap.data() } : null,
    listas,
    gastos: aPlano(gastosSnap),
    gastosRecurrentes: aPlano(recurrentesSnap),
    tareas: aPlano(tareasSnap),
    comprasCerradas: aPlano(comprasCerradasSnap),
    categoriasCompras: aPlano(categoriasComprasSnap),
    categoriasGastos: aPlano(categoriasGastosSnap),
  };
}
