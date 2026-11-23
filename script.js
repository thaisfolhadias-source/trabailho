const form = document.getElementById('pedido');
const selectSabor = document.getElementById('sabor');
const checkboxesAdicionais = document.querySelectorAll('#adicionais input[type="checkbox"]');
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

let pedidos = JSON.parse(localStorage.getItem('pedidos_sorveteria')) || [
  { id: 1, sabor: 'Chocolate', adicionais: ['Granulado'], preco: 17.00, endereco: 'Rua das Flores, 120 - Centro', pagamento: 'Pix', situacao: 'Em preparo' },
  { id: 2, sabor: 'Cookies', adicionais: ['Calda de Chocolate', 'Chantilly'], preco: 22.50, endereco: 'Av. Brasil, 450 - Jardim', pagamento: 'Cartão', situacao: 'Entregue' },
  { id: 3, sabor: 'Morango', adicionais: ['Leite Condensado'], preco: 17.50, endereco: 'Rua Bela Vista, 88 - Sul', pagamento: 'Dinheiro', situacao: 'Em preparo' }
];

function salvarNoNavegador() {
  localStorage.setItem('pedidos_sorveteria', JSON.stringify(pedidos));
}

function formatarMoeda(valor) {
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function extrairNumeroPreco(texto) {
  const apenasDigitos = texto.replace(/\D/g, '');
  if (!apenasDigitos) return 0;
  return Number(apenasDigitos) / 100;
}

function calcularTotal() {
  const opcao = selectSabor.options[selectSabor.selectedIndex];
  let total = Number(opcao?.getAttribute('data-preco') || 0);

  checkboxesAdicionais.forEach(cb => {
    if (cb.checked) {
      total += Number(cb.getAttribute('data-preco') || 0);
    }
  });

  inputPreco.value = formatarMoeda(total);
}

inputPreco.addEventListener('input', (e) => {
  const valorNumerico = extrairNumeroPreco(e.target.value);
  e.target.value = formatarMoeda(valorNumerico);
});

selectSabor.addEventListener('change', calcularTotal);
checkboxesAdicionais.forEach(cb => cb.addEventListener('change', calcularTotal));

function renderizarTabela() {
  const termo = inputPesquisa.value.toLowerCase().trim();

  const filtrados = pedidos.filter(p => {
    const textoAdd = (p.adicionais || []).join(', ').toLowerCase();
    return (
      p.sabor.toLowerCase().includes(termo) ||
      textoAdd.includes(termo) ||
      p.endereco.toLowerCase().includes(termo) ||
      p.pagamento.toLowerCase().includes(termo) ||
      p.situacao.toLowerCase().includes(termo)
    );
  });

  contadorPedidos.textContent = `${filtrados.length} ${filtrados.length === 1 ? 'pedido' : 'pedidos'}`;
  listaPedidos.innerHTML = '';

  if (filtrados.length === 0) {
    listaPedidos.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; color: #c98aa9; padding: 20px;">
          Nenhum pedido encontrado.
        </td>
      </tr>
    `;
    return;
  }

  filtrados.forEach(pedido => {
    const tr = document.createElement('tr');
    const badgeClasse = pedido.situacao === 'Entregue' ? 'badge-entregue' : 'badge-preparo';
    const textoAdicionais = (pedido.adicionais && pedido.adicionais.length > 0)
      ? `+ ${pedido.adicionais.join(', ')}`
      : 'Sem adicionais';

    tr.innerHTML = `
      <td>
        <span class="pedido-titulo">${pedido.sabor} (${formatarMoeda(pedido.preco)})</span>
        <span class="pedido-adicionais">${textoAdicionais}</span>
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

function resetarFormulario() {
  form.reset();
  inputEditId.value = '';
  checkboxesAdicionais.forEach(cb => cb.checked = false);
  inputPreco.value = 'R$ 0,00';
  btnSubmit.textContent = '🛒 Fazer pedido';
  btnCancelar.style.display = 'none';
}

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const precoDigitado = extrairNumeroPreco(inputPreco.value);
  const editId = inputEditId.value;
  const adicionaisSelecionados = Array.from(checkboxesAdicionais)
    .filter(cb => cb.checked)
    .map(cb => cb.value);

  if (editId) {
    const index = pedidos.findIndex(p => p.id === Number(editId));
    if (index !== -1) {
      pedidos[index] = {
        id: Number(editId),
        sabor: selectSabor.value,
        adicionais: adicionaisSelecionados,
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
      adicionais: adicionaisSelecionados,
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

btnCancelar.addEventListener('click', () => {
  resetarFormulario();
  mensagem.textContent = '';
});

listaPedidos.addEventListener('click', (e) => {
  const botao = e.target.closest('button');
  if (!botao) return;

  const id = Number(botao.getAttribute('data-id'));

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

  if (botao.classList.contains('btn-editar')) {
    const pedido = pedidos.find(p => p.id === id);
    if (!pedido) return;

    inputEditId.value = pedido.id;
    selectSabor.value = pedido.sabor;
    checkboxesAdicionais.forEach(cb => {
      cb.checked = (pedido.adicionais || []).includes(cb.value);
    });
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

inputPesquisa.addEventListener('input', renderizarTabela);
renderizarTabela();
