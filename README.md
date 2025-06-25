# Ozonteck PDV & Gestão de Vendas

Sistema completo para gestão de vendas, equipe e produtos, com dashboard, relatórios, permissões avançadas e interface responsiva.

## Funcionalidades Principais

### 1. **Dashboard de Vendas**
- Gráficos dinâmicos (produtos mais vendidos, métodos de pagamento, vendas por período)
- Cards de resumo (total vendido, vendas do dia, etc.)
- Filtros por período
- Visual moderno e responsivo

### 2. **Relatórios de Vendas**
- Listagem detalhada de vendas
- Filtros por período, vendedor, método de pagamento
- Exportação de dados
- Visualização adaptada conforme permissão do usuário

### 3. **Gestão de Equipe**
- Cadastro, edição e remoção de usuários (admin, gestor, vendedor)
- Ativação/desativação de usuários
- Vínculo de vendedores a gestores
- Avatar personalizado (emoji)
- Permissões:
  - **Admin:** gerencia todos, cria gestores e vendedores, vê todos os relatórios
  - **Gestor:** gerencia apenas seus vendedores, vê relatórios da sua equipe
  - **Vendedor:** apenas visualiza suas vendas

### 4. **Gestão de Produtos**
- Cadastro, edição e remoção de produtos
- Upload de imagens
- Controle de estoque

### 5. **Gestão de Categorias e Prioridades**
- Cadastro e edição de categorias de produtos
- Definição de prioridades para organização

### 6. **Controle de Acesso e Login**
- Login seguro por usuário e senha
- Bloqueio de usuários inativos
- Mensagens de erro claras

### 7. **Navegação Mobile First**
- Interface responsiva, adaptada para smartphones e tablets
- Menu e botões de ação centralizados, visual limpo
- Experiência otimizada para toque

### 8. **Permissões e Segurança**
- Cada usuário só acessa o que sua role permite
- Gestor não pode criar outro gestor
- Vendedor não pode acessar gestão de equipe

### 9. **Outros Recursos**
- Migração de estoque por vendedor
- Upload de arquivos
- Backup de dados

---

## Estrutura de Roles
- **Admin:** acesso total
- **Gestor:** gerencia equipe própria
- **Vendedor:** acesso restrito às próprias vendas

## Requisitos
- PHP 7+
- Navegador moderno
- (Opcional) Servidor local para rodar arquivos PHP

## Como usar
1. Faça login com seu usuário.
2. Navegue pelo dashboard, relatórios, gestão de equipe e produtos conforme sua permissão.
3. Use o menu para acessar as principais funções.
4. Admins podem cadastrar gestores e vendedores; gestores apenas vendedores.
5. Relatórios e dashboards são filtrados conforme o usuário logado.

---

Para dúvidas ou sugestões, entre em contato com o desenvolvedor. 