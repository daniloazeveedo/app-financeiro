APP FINANCEIRO ONLINE - VERSÃO 2.0

O que esta versão tem:
- Login por e-mail e senha usando Firebase Authentication.
- Sincronização em nuvem usando Firestore.
- Modo offline/local se o Firebase ainda não estiver configurado.
- Importação e exportação de Excel (.xlsx).
- Dashboard, lançamentos, contas, cartões, limites, relatórios e configurações.

Como testar agora:
1. Extraia o ZIP.
2. Abra index.html no navegador.
3. Clique em "Usar offline".
4. Cadastre lançamentos, contas e limites.
5. Use "Exportar Excel" para baixar uma planilha com os dados.

Como ativar login e nuvem:
1. Acesse console.firebase.google.com.
2. Crie um novo projeto.
3. Vá em Authentication > Sign-in method.
4. Ative Email/Password.
5. Vá em Firestore Database e crie o banco.
6. Vá em Configurações do projeto > Seus apps > Web.
7. Copie o objeto firebaseConfig.
8. Cole os dados no arquivo firebase-config.js.
9. Publique os arquivos no GitHub Pages, Netlify ou Vercel.

Regras simples de Firestore para uso individual por usuário:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}

Observações importantes:
- O Excel é sincronizado por importação/exportação. O navegador não consegue editar automaticamente um arquivo salvo no seu computador sem você importar ou exportar.
- Para sincronização automática com Excel Online/OneDrive seria necessário usar Microsoft Graph API, autenticação Microsoft e backend próprio.
- Não compartilhe suas chaves de Firebase fora do seu projeto. As regras de segurança acima são importantes.


==============================
VERSÃO PWA - INSTALAR NO CELULAR
==============================

Esta versão pode ser instalada na tela inicial do iPhone ou Android, sem App Store.

Como testar no computador:
1. Extraia o ZIP.
2. Abra a pasta em um servidor local. Exemplo:
   - Se tiver Python instalado: python -m http.server 8000
   - Acesse: http://localhost:8000
3. Abrir direto o index.html pode funcionar, mas o PWA/service worker precisa de servidor HTTPS ou localhost.

Como hospedar grátis:
Opção simples: Netlify
1. Acesse netlify.com.
2. Crie uma conta gratuita.
3. Arraste a pasta do projeto para o painel de deploy.
4. Use o link gerado pelo Netlify.

Opção GitHub Pages:
1. Crie um repositório no GitHub.
2. Envie todos os arquivos da pasta.
3. Vá em Settings > Pages.
4. Ative a publicação pela branch main.

Como instalar no iPhone:
1. Abra o link publicado pelo Safari.
2. Toque no botão Compartilhar.
3. Toque em "Adicionar à Tela de Início".
4. Confirme o nome "Meu Controle".
5. O ícone aparecerá na tela inicial.

Como instalar no Android:
1. Abra o link pelo Chrome.
2. Toque em "Instalar app" ou no menu ⋮.
3. Escolha "Adicionar à tela inicial".

Observações:
- Para sincronizar entre dispositivos, configure o Firebase no arquivo firebase-config.js.
- Sem Firebase configurado, o app funciona localmente no navegador.
- O Excel continua por importação e exportação.
- O app não precisa de taxa da Apple nessa versão PWA.
