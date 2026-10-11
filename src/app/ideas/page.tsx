import IdeasView from "@/components/IdeasView";

export default function Ideas() {
  return (
    <>
      <h1 className="page-title">Ideas</h1>
      <p className="page-lead">Contenido y proyectos que cruzan varios de tus intereses.</p>
      <div style={{ marginTop: 28 }}>
        <IdeasView />
      </div>
    </>
  );
}
