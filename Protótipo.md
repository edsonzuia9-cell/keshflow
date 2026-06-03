import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function App() {
  // --- ESTADOS DE AUTENTICAÇÃO ---
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  // --- ESTADOS DO FINANCEIRO ---
  const [lista, setLista] = useState([]);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("Casa");
  const [loading, setLoading] = useState(false);

  // --- ESTADOS PARA EDIÇÃO ---
  const [editandoId, setEditandoId] = useState(null);
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novoValor, setNovoValor] = useState("");

  useEffect(() => {
    verificarUsuario();
  }, []);

  async function verificarUsuario() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    if (data.user) buscarDespesas();
  }

  // --- FUNÇÕES DE AUTH ---
  async function cadastrar() {
    const { error } = await supabase.auth.signUp({ email, password: senha });
    if (error) alert(error.message);
    else alert("Conta criada! Verifique seu e-mail (se o confirmação estiver ativa) ou faça login.");
  }

  async function login() {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) alert(error.message);
    else {
      setUser(data.user);
      buscarDespesas();
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setLista([]);
  }

  // --- FUNÇÕES CRUD (Agora protegidas pelo RLS) ---
  async function buscarDespesas() {
    setLoading(true);
    const { data, error } = await supabase
      .from("despesas")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("Erro ao buscar:", error.message);
    else setLista(data || []);
    setLoading(false);
  }

  async function adicionar() {
    if (descricao === "" || valor === "") return alert("Preencha os campos!");

    const { error } = await supabase.from("despesas").insert([
      { 
        descricao, 
        valor: Number(valor), 
        categoria, 
        user_id: user.id // Importante para o RLS
      }
    ]);

    if (error) alert("Erro ao salvar: " + error.message);
    else {
      setDescricao(""); setValor("");
      buscarDespesas();
    }
  }

  async function salvarEdicao(id) {
    const { error } = await supabase
      .from("despesas")
      .update({ descricao: novaDescricao, valor: Number(novoValor) })
      .eq("id", id);

    if (error) alert("Erro ao atualizar!");
    else {
      setEditandoId(null);
      buscarDespesas();
    }
  }

  async function remover(id) {
    const { error } = await supabase.from("despesas").delete().eq("id", id);
    if (error) alert("Erro ao remover!");
    else buscarDespesas();
  }

  const total = lista.reduce((acc, item) => acc + Number(item.valor), 0);

  return (
    <div style={styles.container}>
      <h1 style={{ textAlign: 'center' }}>💰 Finança-App Pro</h1>

      {!user ? (
        /* TELA DE LOGIN */
        <div style={styles.authBox}>
          <h3>Acesse sua conta</h3>
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={styles.input} />
          <input type="password" placeholder="Senha" value={senha} onChange={e => setSenha(e.target.value)} style={styles.input} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={cadastrar} style={styles.btnSecundario}>Criar Conta</button>
            <button onClick={login} style={styles.btnPrincipal}>Entrar</button>
          </div>
        </div>
      ) : (
        /* DASHBOARD PRIVADO */
        <div>
          <div style={styles.userBar}>
            <span>Bem-vindo, <strong>{user.email}</strong></span>
            <button onClick={logout} style={styles.btnLogout}>Sair</button>
          </div>

          <div style={styles.cardSaldo}>
            <p>Saldo Total</p>
            <h2>{total.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}</h2>
          </div>

          <div style={styles.formulario}>
            <input placeholder="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)} style={styles.input} />
            <input type="number" placeholder="Valor" value={valor} onChange={e => setValor(e.target.value)} style={styles.input} />
            <button onClick={adicionar} style={styles.btnPrincipal}>Adicionar</button>
          </div>

          <hr />

          {loading ? <p>Carregando dados...</p> : (
            <ul style={styles.lista}>
              {lista.map(item => (
                <li key={item.id} style={styles.itemLista}>
                  {editandoId === item.id ? (
                    <div style={{ display: 'flex', gap: '5px', flex: 1 }}>
                      <input value={novaDescricao} onChange={e => setNovaDescricao(e.target.value)} style={styles.input} />
                      <input type="number" value={novoValor} onChange={e => setNovoValor(e.target.value)} style={styles.input} />
                      <button onClick={() => salvarEdicao(item.id)} style={styles.btnEmoji}>💾</button>
                      <button onClick={() => setEditandoId(null)} style={styles.btnEmoji}>❌</button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <strong>{item.descricao}</strong>
                        <div style={{ color: '#27ae60', fontSize: '0.9em' }}>
                          {Number(item.valor).toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}
                        </div>
                      </div>
                      <div>
                        <button onClick={() => {
                          setEditandoId(item.id);
                          setNovaDescricao(item.descricao);
                          setNovoValor(item.valor);
                        }} style={styles.btnEmoji}>✏️</button>
                        <button onClick={() => remover(item.id)} style={styles.btnEmoji}>🗑️</button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '500px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' },
  authBox: { border: '1px solid #ccc', padding: '20px', borderRadius: '8px', background: '#f9f9f9' },
  input: { display: 'block', width: '100%', marginBottom: '10px', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' },
  btnPrincipal: { background: '#27ae60', color: 'white', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1 },
  btnSecundario: { background: '#3498db', color: 'white', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1 },
  userBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '0.9em' },
  btnLogout: { background: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' },
  cardSaldo: { background: '#2c3e50', color: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', marginBottom: '20px' },
  formulario: { display: 'flex', gap: '10px', marginBottom: '20px' },
  lista: { listStyle: 'none', padding: 0 },
  itemLista: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #eee' },
  btnEmoji: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }
};

export default App;



////////////////////////////////////////////////////////////////

import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// 1. IMPORTAÇÕES DO CHART.JS
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";

// 2. REGISTO DOS COMPONENTES DO GRÁFICO
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

function App() {
  const [user, setUser] = useState(null);
  const [lista, setLista] = useState([]);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("Casa");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todos");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  useEffect(() => {
    verificarUsuario();
  }, []);

  useEffect(() => {
    if (user) buscarDespesas();
  }, [categoriaFiltro, user]);

  async function verificarUsuario() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  }

  // --- AUTH ---
  async function login() {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) alert(error.message);
    else setUser(data.user);
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setLista([]);
  }

  // --- CRUD ---
  async function buscarDespesas() {
    let query = supabase.from("despesas").select("*").eq("user_id", user.id);
    if (categoriaFiltro !== "Todos") query = query.eq("categoria", categoriaFiltro);
    
    const { data } = await query.order("created_at", { ascending: false });
    setLista(data || []);
  }

  async function adicionarDespesa() {
    if (!descricao || !valor) return;
    await supabase.from("despesas").insert([{ 
      descricao, 
      valor: Number(valor), 
      categoria, 
      user_id: user.id 
    }]);
    setDescricao(""); setValor("");
    buscarDespesas();
  }

  async function removerDespesa(id) {
    await supabase.from("despesas").delete().eq("id", id);
    buscarDespesas();
  }

  // --- LÓGICA DOS GRÁFICOS ---
  const categoriasLabel = ["Casa", "Trabalho", "Lazer"];
  const valoresPorCategoria = categoriasLabel.map((cat) => {
    return lista
      .filter((item) => item.categoria === cat)
      .reduce((acc, item) => acc + Number(item.valor), 0);
  });

  const pieData = {
    labels: categoriasLabel,
    datasets: [{
      label: "Gastos",
      data: valoresPorCategoria,
      backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
      hoverOffset: 4
    }]
  };

  const total = lista.reduce((acc, item) => acc + Number(item.valor), 0);

  if (!user) {
    return (
      <div style={styles.authContainer}>
        <h2>🔐 Acesso ao Finança-App</h2>
        <input placeholder="Email" onChange={e => setEmail(e.target.value)} style={styles.input} />
        <input type="password" placeholder="Senha" onChange={e => setSenha(e.target.value)} style={styles.input} />
        <button onClick={login} style={styles.btnPrincipal}>Entrar</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>📊 Dashboard Fintech</h1>
        <button onClick={logout} style={styles.btnSair}>Sair</button>
      </header>

      <div style={styles.grid}>
        {/* COLUNA ESQUERDA: INPUTS E LISTA */}
        <div style={styles.col}>
          <div style={styles.card}>
            <h3>Total: {total.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}</h3>
            <div style={styles.form}>
              <input placeholder="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)} style={styles.input} />
              <input type="number" placeholder="Valor" value={valor} onChange={e => setValor(e.target.value)} style={styles.input} />
              <select value={categoria} onChange={e => setCategoria(e.target.value)} style={styles.input}>
                <option>Casa</option>
                <option>Trabalho</option>
                <option>Lazer</option>
              </select>
              <button onClick={adicionarDespesa} style={styles.btnPrincipal}>Adicionar</button>
            </div>
          </div>

          <div style={styles.card}>
            <select onChange={e => setCategoriaFiltro(e.target.value)} style={styles.input}>
              <option>Todos</option><option>Casa</option><option>Trabalho</option><option>Lazer</option>
            </select>
            <ul style={styles.lista}>
              {lista.map(item => (
                <li key={item.id} style={styles.item}>
                  {item.descricao} - <strong>{item.valor} MT</strong>
                  <button onClick={() => removerDespesa(item.id)} style={styles.btnDel}>🗑️</button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* COLUNA DIREITA: GRÁFICOS */}
        <div style={styles.col}>
          <div style={styles.card}>
            <h3>Divisão por Categoria</h3>
            <Pie data={pieData} />
          </div>
          

[Image of Pie chart showing financial categories]

          <div style={styles.card}>
            <h3>Comparativo de Gastos</h3>
            <Bar data={{
              labels: categoriasLabel,
              datasets: [{ label: 'MZN', data: valoresPorCategoria, backgroundColor: '#36A2EB' }]
            }} />
          </div>
          
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f4f7f6' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' },
  card: { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '20px' },
  input: { padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ddd', width: '100%', boxSizing: 'border-box' },
  btnPrincipal: { width: '100%', padding: '12px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  btnSair: { background: '#e74c3c', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' },
  lista: { listStyle: 'none', padding: 0 },
  item: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' },
  btnDel: { background: 'none', border: 'none', cursor: 'pointer' },
  authContainer: { maxWidth: '350px', margin: '100px auto', padding: '30px', background: 'white', borderRadius: '12px', textAlign: 'center' }
};

export default App;