import { ListaDetalle } from "@/components/listas/ListaDetalle";

export default async function ListaDetallePage({
  params,
}: {
  params: Promise<{ listaId: string }>;
}) {
  const { listaId } = await params;
  return <ListaDetalle listaId={listaId} />;
}
