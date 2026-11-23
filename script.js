const form = document.getElementById('pedido');
const selectSabor = document.getElementById('sabor');
const inputPreco = document.getElementById('preco');
const inputEndereco = document.getElementById('endereco');
const selectPagamento = document.getElementById('pagamento');
const selectSituacao = document.getElementById('situacao');
const inputEditId = document.getElementById('edit-id');
const btnSubmit = document.getElementById('btn-submit');
const btnCancelar = document.getElementById('btn-cancelar');
const mensagem = document.getElementById('mensagem');

const listaPedidos = document.getElementById('lista-pedidos');
const contadorPedidos = document.getElementById('contador-pedidos');
const inputPesquisa = document.getElementById('pesquisa');

// Carrega os pedidos salvos ou usa os exemplos iniciais
let pedidos = JSON.parse(localStorage.getItem('pedidos_sorveteria')) || [
  { id: 1, sabor: 'Chocolate', preco: 15.00, endereco: 'Rua das Flores, 120 - Centro', pagamento: 'Pix', situacao: 'Em preparo' },
  { id: 2, sabor: 'Cookies', preco: 17.00, endereco: 'Av. Brasil, 450 - Jardim', pagamento: 'Cartão', situacao: 'Entregue' },
  { id: 3, sabor: 'Morango', preco: 15.00, endereco: 'Rua Bela Vista, 88 - Sul', pagamento: 'Dinheiro', situacao: 'Em preparo' }
];

function salvarNoNavegador() {
  localStorage.setItem('pedidos_sorveteria', JSON.stringify(pedidos));
}

// Formata número para moeda brasileira (ex: 15.5 -> "R$ 15,50")
function formatarMoeda(valor) {
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

// Converte texto digitado ("R$ 15,50") para número (15.5)
function extrairNumeroPreco(texto) {
  const apenasDigitos = texto.replace(/\D/g, '');
  if (!apenasDigitos) return 0;
  return Number(apenasDigitos) / 100;
}

// Permite digitar o valor livremente com máscara automática de R$
inputPreco.addEventListener('input', (e) => {
  const valorNumerico = extrairNumeroPreco(e.target.value);
  e.target.value = formatarMoeda(valorNumerico);
});

// Sugere o preço padrão ao trocar o sabor (mas você ainda pode alterá-lo digitando)
selectSabor.addEventListener('change', () => {
  const opcao = selectSabor.options[selectSabor.selectedIndex];
  const precoSugerido = opcao.getAttribute('data-preco');
  if (precoSugerido) {
    inputPreco.value = formatarMoeda(precoSugerido);
  }
});

// Renderiza a lista de pedidos na tabela
function renderizarTabela() {
  const termo = inputPesquisa.value.toLowerCase().trim();

  const filtrados = pedidos.filter(p =>
    p.sabor.toLowerCase().includes(termo) ||
    p.endereco.toLowerCase().includes(termo) ||
    p.pagamento.toLowerCase().includes(termo) ||
    p.situacao.toLowerCase().includes(termo)
  );

  contadorPedidos.textContent = `${filtrados.length} ${filtrados.length === 1 ? 'pedido' : 'pedidos'}`;
  listaPedidos.innerHTML = '';

  if (filtrados.length === 0) {
    listaPedidos.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; color: #6b344d; padding: 20px;">
          Nenhum pedido encontrado.
        </td>
      </tr>
    `;
    return;
  }

  filtrados.forEach(pedido => {
    const tr = document.createElement('tr');
    const badgeClasse = pedido.situacao === 'Entregue' ? 'badge-entregue' : 'badge-preparo';

    tr.innerHTML = `
      <td>
        <span class="pedido-titulo">${pedido.sabor} (${formatarMoeda(pedido.preco)})</span>
        <span class="pedido-subtitulo">${pedido.endereco}</span>
      </td>
      <td>${pedido.pagamento}</td>
      <td><span class="badge ${badgeClasse}">${pedido.situacao}</span></td>
      <td>
        <div class="acoes-grupo">
          <button type="button" class="btn-acao btn-editar" data-id="${pedido.id}">Editar</button>
          <button type="button" class="btn-acao btn-excluir" data-id="${pedido.id}">Excluir</button>
        </div>
      </td>
    `;
    listaPedidos.appendChild(tr);
  });
}

// Resetar estado do formulário (tanto após salvar quanto ao cancelar edição)
function resetarFormulario() {
  form.reset();
  inputEditId.value = '';
  inputPreco.value = 'R$ 0,00';
  btnSubmit.textContent = '🛒 Fazer pedido';
  btnCancelar.style.display = 'none';
}

// Botão Fazer pedido / Salvar alterações
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const precoDigitado = extrairNumeroPreco(inputPreco.value);
  const editId = inputEditId.value;

  if (editId) {
    const index = pedidos.findIndex(p => p.id === Number(editId));
    if (index !== -1) {
      pedidos[index] = {
        id: Number(editId),
        sabor: selectSabor.value,
        preco: precoDigitado,
        endereco: inputEndereco.value.trim(),
        pagamento: selectPagamento.value,
        situacao: selectSituacao.value
      };
    }
    mensagem.textContent = 'Pedido atualizado com sucesso!';
  } else {
    pedidos.unshift({
      id: Date.now(),
      sabor: selectSabor.value,
      preco: precoDigitado,
      endereco: inputEndereco.value.trim(),
      pagamento: selectPagamento.value,
      situacao: selectSituacao.value
    });
    mensagem.textContent = 'Pedido registrado na lista!';
  }

  inputPesquisa.value = '';
  salvarNoNavegador();
  renderizarTabela();
  resetarFormulario();

  setTimeout(() => { mensagem.textContent = ''; }, 3000);
});

// Botão Cancelar edição
btnCancelar.addEventListener('click', () => {
  resetarFormulario();
  mensagem.textContent = '';
});

// Cliques nos botões Editar e Excluir dentro da tabela
listaPedidos.addEventListener('click', (e) => {
  const botao = e.target.closest('button');
  if (!botao) return;

  const id = Number(botao.getAttribute('data-id'));

  // Ação: EXCLUIR
  if (botao.classList.contains('btn-excluir')) {
    pedidos = pedidos.filter(p => p.id !== id);
    if (Number(inputEditId.value) === id) {
      resetarFormulario();
    }
    salvarNoNavegador();
    renderizarTabela();
    mensagem.textContent = 'Pedido excluído.';
    setTimeout(() => { mensagem.textContent = ''; }, 2500);
  }

  // Ação: EDITAR
  if (botao.classList.contains('btn-editar')) {
    const pedido = pedidos.find(p => p.id === id);
    if (!pedido) return;

    inputEditId.value = pedido.id;
    selectSabor.value = pedido.sabor;
    inputPreco.value = formatarMoeda(pedido.preco);
    inputEndereco.value = pedido.endereco;
    selectPagamento.value = pedido.pagamento;
    selectSituacao.value = pedido.situacao;

    btnSubmit.textContent = '💾 Salvar alterações';
    btnCancelar.style.display = 'block';
    mensagem.textContent = 'Editando pedido selecionado...';
    inputPreco.focus();
  }
});

// Filtro de pesquisa
inputPesquisa.addEventListener('input', renderizarTabela);

// Inicializa a tabela
renderizarTabela();
