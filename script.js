
const form = document.getElementById("formTarefa");
const campoTitulo = document.getElementById("titulo");
const campoMateria = document.getElementById("materia");
const campoPrazo = document.getElementById("prazo");
const campoDescricao = document.getElementById("descricao");
const filtro = document.getElementById("filtro");
const lista = document.getElementById("listaTarefas");
const mensagem = document.getElementById("mensagem");

const STORAGE_KEY = "estudaFacilTarefas";

let tarefas = carregarTarefas();

// Retorna a data atual no formato YYYY-MM-DD, usando a data local.
function dataHoje() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

// Carrega as tarefas salvas no navegador.
function carregarTarefas() {
    try {
        const dados = localStorage.getItem(STORAGE_KEY);
        const tarefasSalvas = dados ? JSON.parse(dados) : [];

        return Array.isArray(tarefasSalvas) ? tarefasSalvas : [];
    } catch (erro) {
        console.error("Não foi possível carregar as tarefas:", erro);
        return [];
    }
}

// Salva as tarefas no armazenamento local.
function salvarTarefas() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tarefas));
        return true;
    } catch (erro) {
        console.error("Não foi possível salvar as tarefas:", erro);
        mostrarMensagem(
            "Não foi possível salvar. Verifique o armazenamento do navegador.",
            true
        );
        return false;
    }
}

// Exibe mensagens para o usuário.
function mostrarMensagem(texto, erro = false) {
    mensagem.textContent = texto;
    mensagem.style.color = erro ? "#cf414b" : "#21865b";
}

// Gera um identificador para cada tarefa.
function gerarId() {
    if (window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Verifica se a tarefa está atrasada.
function estaAtrasada(tarefa) {
    return !tarefa.concluida && tarefa.prazo < dataHoje();
}

// Verifica se a entrega está próxima: hoje ou nos próximos dois dias.
function estaProxima(tarefa) {
    if (tarefa.concluida || estaAtrasada(tarefa)) {
        return false;
    }

    const hoje = new Date(`${dataHoje()}T00:00:00`);
    const prazo = new Date(`${tarefa.prazo}T00:00:00`);
    const diferenca = (prazo - hoje) / (1000 * 60 * 60 * 24);

    return diferenca >= 0 && diferenca <= 2;
}

// Converte a data para o formato brasileiro.
function formatarData(data) {
    if (!data) return "Sem data";

    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
}

// Cria elementos de texto sem interpretar os dados como HTML.
function criarTexto(tag, classe, texto) {
    const elemento = document.createElement(tag);

    if (classe) {
        elemento.className = classe;
    }

    elemento.textContent = texto;
    return elemento;
}

// Atualiza os números do resumo.
function atualizarResumo() {
    const concluidas = tarefas.filter(
        tarefa => tarefa.concluida
    ).length;

    const pendentes = tarefas.filter(
        tarefa => !tarefa.concluida
    ).length;

    const atrasadas = tarefas.filter(
        estaAtrasada
    ).length;

    document.getElementById("totalTarefas").textContent =
        tarefas.length;

    document.getElementById("tarefasPendentes").textContent =
        pendentes;

    document.getElementById("tarefasConcluidas").textContent =
        concluidas;

    document.getElementById("tarefasAtrasadas").textContent =
        atrasadas;
}

// Determina o texto e a cor do prazo.
function obterStatus(tarefa) {
    if (tarefa.concluida) {
        return { texto: "Concluída", classe: "concluida" };
    }

    if (estaAtrasada(tarefa)) {
        return { texto: "Atrasada", classe: "atrasada" };
    }

    if (tarefa.prazo === dataHoje()) {
        return { texto: "Entrega hoje", classe: "proxima" };
    }

    if (estaProxima(tarefa)) {
        return { texto: "Prazo próximo", classe: "proxima" };
    }

    return { texto: "Pendente", classe: "" };
}

// Monta o cartão de uma tarefa.
function criarCartao(tarefa) {
    const cartao = document.createElement("article");
    cartao.className = "tarefa";

    if (tarefa.concluida) {
        cartao.classList.add("tarefa-concluida");
    }

    const informacoes = document.createElement("div");
    informacoes.className = "tarefa-info";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = tarefa.concluida;
    checkbox.setAttribute(
        "aria-label",
        `Marcar ${tarefa.titulo} como concluída`
    );

    checkbox.addEventListener("change", () => {
        const anterior = tarefa.concluida;
        tarefa.concluida = checkbox.checked;

        if (!salvarTarefas()) {
            tarefa.concluida = anterior;
        }

        renderizar();
    });

    const conteudo = document.createElement("div");
    conteudo.className = "tarefa-conteudo";

    conteudo.appendChild(
        criarTexto("h3", "", tarefa.titulo)
    );

    conteudo.appendChild(
        criarTexto("p", "", `📚 ${tarefa.materia}`)
    );

    conteudo.appendChild(
        criarTexto("p", "", `📅 Entrega: ${formatarData(tarefa.prazo)}`)
    );

    if (tarefa.descricao) {
        conteudo.appendChild(
            criarTexto("p", "", tarefa.descricao)
        );
    }

    informacoes.append(checkbox, conteudo);

    const acoes = document.createElement("div");
    acoes.className = "tarefa-acoes";

    const status = obterStatus(tarefa);
    const etiqueta = criarTexto(
        "span",
        `status ${status.classe}`.trim(),
        status.texto
    );

    const excluir = criarTexto("button", "botao-excluir", "Excluir");
    excluir.type = "button";
    excluir.setAttribute("aria-label", `Excluir ${tarefa.titulo}`);

    excluir.addEventListener("click", () => {
        const confirmado = window.confirm(
            `Deseja excluir a tarefa "${tarefa.titulo}"?`
        );

        if (!confirmado) return;

        const indice = tarefas.findIndex(
            item => item.id === tarefa.id
        );

        if (indice === -1) return;

        const removida = tarefas.splice(indice, 1)[0];

        if (!salvarTarefas()) {
            tarefas.splice(indice, 0, removida);
        }

        renderizar();
    });

    acoes.append(etiqueta, excluir);
    cartao.append(informacoes, acoes);

    return cartao;
}

// Aplica o filtro selecionado.
function obterTarefasFiltradas() {
    switch (filtro.value) {
        case "pendentes":
            return tarefas.filter(tarefa => !tarefa.concluida);

        case "concluidas":
            return tarefas.filter(tarefa => tarefa.concluida);

        case "atrasadas":
            return tarefas.filter(estaAtrasada);

        default:
            return [...tarefas];
    }
}

// Ordena por prazo e atualiza a tela.
function renderizar() {
    atualizarResumo();
    lista.replaceChildren();

    const tarefasFiltradas = obterTarefasFiltradas();

    tarefasFiltradas.sort((a, b) => {
        if (a.concluida !== b.concluida) {
            return Number(a.concluida) - Number(b.concluida);
        }

        return a.prazo.localeCompare(b.prazo);
    });

    if (tarefasFiltradas.length === 0) {
        const vazio = document.createElement("div");
        vazio.className = "vazio";

        vazio.appendChild(
            criarTexto("span", "", "🗂️")
        );

        vazio.appendChild(
            criarTexto("h3", "", "Nenhuma tarefa encontrada")
        );

        vazio.appendChild(
            criarTexto(
                "p",
                "",
                filtro.value === "todas"
                    ? "Adicione sua primeira tarefa para começar!"
                    : "Não existem tarefas nesta categoria."
            )
        );

        lista.appendChild(vazio);
        return;
    }

    tarefasFiltradas.forEach(tarefa => {
        lista.appendChild(criarCartao(tarefa));
    });
}

// Cadastra uma nova tarefa.
form.addEventListener("submit", evento => {
    evento.preventDefault();

    const titulo = campoTitulo.value.trim();
    const materia = campoMateria.value;
    const prazo = campoPrazo.value;
    const descricao = campoDescricao.value.trim();

    if (!titulo || !materia || !prazo) {
        mostrarMensagem(
            "Preencha o nome, a matéria e a data de entrega.",
            true
        );
        return;
    }

    // Confere se a data informada é válida.
    const dataValida = /^\d{4}-\d{2}-\d{2}$/.test(prazo);
    const dataConvertida = new Date(`${prazo}T00:00:00`);

    if (
        !dataValida ||
        Number.isNaN(dataConvertida.getTime()) ||
        dataConvertida.toISOString().slice(0, 10) !== prazo
    ) {
        mostrarMensagem("Informe uma data de entrega válida.", true);
        return;
    }

    const novaTarefa = {
        id: gerarId(),
        titulo,
        materia,
        prazo,
        descricao,
        concluida: false
    };

    tarefas.push(novaTarefa);

    if (!salvarTarefas()) {
        tarefas.pop();
        return;
    }

    form.reset();
    mostrarMensagem("Tarefa adicionada com sucesso!");

    // Exibe a tarefa recém-cadastrada mesmo se outro filtro estiver ativo.
    filtro.value = "todas";
    renderizar();
});

// Atualiza a lista quando o filtro mudar.
filtro.addEventListener("change", renderizar);

// Atualiza o status dos prazos ao abrir a página.
renderizar();
