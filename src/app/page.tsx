import RecentItems from "@/components/RecentItems";

export default function Inicio() {
  return (
    <>
      <h1 className="page-title">Inicio</h1>
      <p className="page-lead">Lo último que has guardado.</p>
      <RecentItems />
    </>
  );
}
