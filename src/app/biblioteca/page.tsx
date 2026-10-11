import Library from "@/components/Library";

export default function Biblioteca() {
  return (
    <>
      <h1 className="page-title">Biblioteca</h1>
      <p className="page-lead">Todo lo que has guardado, en un solo lugar.</p>
      <div style={{ marginTop: 28 }}>
        <Library />
      </div>
    </>
  );
}
