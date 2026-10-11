import ProfileView from "@/components/ProfileView";

export default function Perfil() {
  return (
    <>
      <h1 className="page-title">Perfil</h1>
      <p className="page-lead">Los grupos de intereses que se repiten en lo que guardas.</p>
      <div style={{ marginTop: 28 }}>
        <ProfileView />
      </div>
    </>
  );
}
