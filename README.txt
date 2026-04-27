Meu Controle 3.1

Versão ajustada com base nas referências visuais enviadas.

Novidades desta versão:
- visual mais próximo do estilo Organizze nas telas principais
- tela de Fluxo de Caixa com mês, filtro, modo de visualização e resumo inferior
- ao clicar em um lançamento, abre um painel detalhado com as ações:
  * Editar
  * Excluir
  * Duplicar
  * Alterar status
- telas de Contas, Cartões, Categorias, Tags, Perfil, Ajuda e Configurações
- Relatórios com abas: Categorias, Balanço e Tags
- armazenamento local no navegador
- exportação pronta para Excel via código (Ctrl/Cmd + E)

Arquivos principais:
- index.html
- style.css
- app.js

Para usar:
1. Abra o index.html em um navegador.
2. Para instalar como app, publique em um hosting estático e abra no celular.
3. O app salva localmente no navegador.


Atualização 3.1.1:
- corrigida a responsividade no navegador/desktop;
- app agora expande melhor em telas grandes;
- reduzida a chance de rolagem horizontal;
- cards da tela inicial se organizam em colunas no desktop.


Atualização 3.1.2:
- desktop agora usa barra superior horizontal no estilo web;
- layout ocupa a largura da tela do usuário no PC;
- menu inferior fica só no mobile;
- painel de detalhes da transação ganhou botão X;
- clicar fora do painel também fecha a transação/modal.


Atualização 3.1.3:
- corrigido o conteúdo ficando escondido embaixo do menu superior no desktop;
- desktop agora começa abaixo da barra verde;
- ajustado grid da tela inicial para não cortar cards;
- corrigida rolagem interna do conteúdo.


Atualização 3.1.4:
- corrigido corte no card de Resumo rápido;
- ativada a troca de tema em Configurações:
  * Usar do sistema
  * Modo escuro
  * Modo claro
- melhorado o layout das configurações no desktop.


Atualização 3.2.0:
- fonte Urbanist aplicada via Google Fonts;
- paleta ajustada para a referência enviada: #E7F63C, #181C22, #D2D2D3 e #FFFFFF;
- barra superior, botões, ticker de cotações, cards e página Mercado harmonizados com a nova identidade visual;
- configurações, dados, perfil e funcionalidades anteriores preservados.


Atualização 3.2.1:
- home desktop refeita em formato dashboard profissional, baseada no mockup aprovado;
- layout desktop e mobile separados;
- barra de cotações preservada e integrada visualmente à nova paleta;
- fonte Urbanist aplicada ao projeto;
- paleta Geovea: #E7F63C, #181C22, #D2D2D3 e #FFFFFF;
- pasta assets/banks criada com arquivos SVG de identidade visual dos bancos;
- edição de perfil/foto e configurações anteriores preservadas;
- cards de contas e cartões redesenhados na home desktop;
- opção de ocultar valores mantida.


Atualização 3.2.2:
- corrigida a sobreposição de header/ticker/conteúdo;
- tela inicial desktop ajustada para ficar mais próxima do mockup aprovado;
- barra de mercado com indicação de última atualização;
- ativos favoritos aparecem na barra superior e na página Mercado;
- adicionada tela/modal para adicionar/remover ativos favoritos;
- ativos disponíveis: IBOV, Dólar, Euro, Bitcoin, PETR4, VALE3, ITUB4, S&P 500 e Nasdaq;
- cotações reais via APIs públicas gratuitas quando disponíveis, com fallback local para evitar quebra visual;
- opção nas configurações para exibir/ocultar barra de cotações e ativar/desativar atualização automática.


Atualização 3.2.3:
- corrigido o header/ticker invadindo o conteúdo;
- barra de ativos agora renderiza fallback imediatamente e depois tenta atualizar com API real;
- corrigido botão "Adicionar ativo";
- adicionada atualização automática real com fallback visual;
- configurações reorganizadas para não cortar os botões;
- barras internas de lançamentos/relatórios/categorias alinhadas no desktop;
- correção estrutural aplicada para todas as abas no desktop.


Atualização 3.2.4:
- barra superior refeita em largura total, estilo portal financeiro;
- paleta trocada para preto/branco/verde, inspirada em portal de mercado;
- ticker de cotações em grade horizontal, com rolagem automática;
- ticker mostra dados imediatamente e depois tenta atualizar com APIs gratuitas;
- botão Adicionar ativo corrigido e modal priorizado sobre as telas;
- configurações reorganizadas novamente para evitar cortes/sobreposição;
- barras internas das abas alinhadas para desktop.


Atualização 3.2.5:
- removida chamada direta à Brapi no front-end para evitar erro 401;
- cotações usam AwesomeAPI para dólar/euro/bitcoin e fallback local para B3/índices;
- ticker não fica vazio e rola automaticamente mesmo se API falhar;
- paleta alterada para verde/cream: #16C64F, #008440, #2F473F e #FBF7EA;
- topo voltou para estilo verde, inspirado no Organizze;
- logo criado em CSS inspirado no símbolo verde enviado;
- botão Adicionar ativo corrigido e modal preservado;
- configurações e barras internas mantidas com correções de alinhamento.
