import { useEffect, useState } from "react";
import "./App.css";

const BASE_URL =
  "https://botfilter-h5ddh6dye8exb7ha.centralus-01.azurewebsites.net";

const EMAIL = "matzenbacherkena@gmail.com";

export default function App() {
  const [candidate, setCandidate] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [repoUrls, setRepoUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitState, setSubmitState] = useState({});

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      // Step 2 - Obtener candidato
      const candRes = await fetch(
        `${BASE_URL}/api/candidate/get-by-email?email=${EMAIL}`
      );
      if (!candRes.ok) throw new Error("Error obteniendo candidato");
      const candData = await candRes.json();
      setCandidate(candData);

      // Step 3 - Obtener jobs
      const jobsRes = await fetch(`${BASE_URL}/api/jobs/get-list`);
      if (!jobsRes.ok) throw new Error("Error obteniendo jobs");
      const jobsData = await jobsRes.json();
      setJobs(jobsData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitJob(jobId) {
    const repoUrl = repoUrls[jobId];
    if (!repoUrl) {
      alert("Ingresá la URL del repositorio");
      return;
    }

    setSubmitState((s) => ({
      ...s,
      [jobId]: { loading: true },
    }));

    try {
      const res = await fetch(
        `${BASE_URL}/api/candidate/apply-to-job`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uuid: candidate.uuid,
            candidateId: candidate.candidateId,
            applicationId: candidate.applicationId,
            jobId: jobId,
            repoUrl: repoUrl,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al enviar postulación");
      }

      setSubmitState((s) => ({
        ...s,
        [jobId]: { success: true },
      }));
    } catch (e) {
      setSubmitState((s) => ({
        ...s,
        [jobId]: { error: e.message },
      }));
    }
  }

  if (loading) return <p className="status">Cargando…</p>;
  if (error) return <p className="status error">{error}</p>;

  return (
    <div className="page">
      <div className="container">
        <h1 className="title">Nimble Gravity – Challenge</h1>

        {candidate && (
          <div className="candidate">
            <div className="candidate-name">
              {candidate.firstName} {candidate.lastName}
            </div>
            <div className="candidate-email">{candidate.email}</div>
          </div>
        )}

        <h2 className="subtitle">Posiciones abiertas</h2>

        <div className="grid">
          {jobs.map((job) => (
            <div className="card" key={job.id}>
              <h3 className="job-title">{job.title}</h3>

              <input
                className="input"
                placeholder="https://github.com/tu-usuario/tu-repo"
                value={repoUrls[job.id] || ""}
                onChange={(e) =>
                  setRepoUrls({ ...repoUrls, [job.id]: e.target.value })
                }
              />

              <button
                className="button"
                onClick={() => submitJob(job.id)}
                disabled={submitState[job.id]?.loading}
              >
                {submitState[job.id]?.loading ? "Enviando…" : "Submit"}
              </button>

              {submitState[job.id]?.success && (
                <p className="success">Postulación enviada ✔</p>
              )}

              {submitState[job.id]?.error && (
                <p className="error">{submitState[job.id].error}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

