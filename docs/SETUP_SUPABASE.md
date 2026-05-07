# Setup do Supabase — Fase 1

Passo a passo para criar o backend do app pós-operatório do Dr. Taiuã Milan.
Tempo estimado: **15 minutos**.

---

## 1. Criar o projeto

1. Entre em <https://supabase.com> com sua conta Google.
2. Clique em **New Project**.
3. Preencha:
   - **Name**: `drtaiuamilan-app`
   - **Database password**: gere uma senha forte e guarde no seu gerenciador de senhas (1Password, Bitwarden). Você não usará no dia a dia, mas precisará para acessar o banco diretamente em emergências.
   - **Region**: **South America (São Paulo)** — obrigatório para LGPD.
   - **Pricing plan**: **Free** (suficiente para piloto).
4. Clique em **Create new project** e aguarde 1–2 minutos.

---

## 2. Aplicar as migrations

Quando o projeto estiver pronto:

1. No menu lateral, abra **SQL Editor**.
2. Clique em **New query**.
3. Cole o conteúdo de cada arquivo abaixo, **um de cada vez, na ordem**, e clique em **Run** após cada um:

   1. `supabase/migrations/0001_initial_schema.sql`
   2. `supabase/migrations/0002_rls.sql`
   3. `supabase/migrations/0003_funcoes.sql`
   4. `supabase/seed.sql`

4. Cada execução deve terminar com **Success. No rows returned** (ou um aviso de quantos marcos foram cadastrados, no caso do seed). Se algum falhar, copie a mensagem de erro e me envie.

---

## 3. Pegar URL e chave anon

1. No menu lateral, abra **Project Settings** (ícone de engrenagem) → **API**.
2. Copie:
   - **Project URL** → corresponde a `VITE_SUPABASE_URL`
   - **anon public** key → corresponde a `VITE_SUPABASE_ANON_KEY`

> ⚠️ **NUNCA** copie a chave `service_role` para o código do app. Ela só deve ser usada no painel admin (Fase 7) ou em Edge Functions.

---

## 4. Configurar localmente (desenvolvimento)

Na raiz do projeto:

```bash
cp .env.example .env.local
```

Edite `.env.local`:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_LGPD_VERSAO=1
```

Rode `npm run dev` e acesse `http://localhost:5173`.

---

## 5. Configurar no Netlify (produção/preview)

1. Em <https://app.netlify.com/projects/drtaiuamilan-app-preview>, vá em **Site configuration** → **Environment variables**.
2. Adicione as três variáveis acima (mesmos valores).
3. **Deploys** → **Trigger deploy** → **Deploy site**.

---

## 6. Cadastrar um paciente de teste

Use o **SQL Editor** do Supabase para inserir um paciente de teste e gerar um token:

```sql
-- 1. Inserir paciente
insert into pacientes (nome, telefone, procedimento, lado, data_cirurgia)
values (
  'Maria Teste',
  '+5547999990000',
  'ATQ_POSTERIOR',
  'DIREITO',
  current_date - interval '3 days'
)
returning id;

-- 2. Gerar token de acesso (válido por 90 dias)
-- Substitua <PACIENTE_ID> pelo id retornado acima
insert into acessos_paciente (paciente_id, token, expira_em)
values (
  '<PACIENTE_ID>'::uuid,
  encode(gen_random_bytes(24), 'base64'),
  now() + interval '90 days'
)
returning token;
```

Copie o token retornado e abra:

```
https://drtaiuamilan-app-preview.netlify.app/p/<TOKEN>
```

(O token contém `+`, `/` e `=` — use o token **exatamente** como retornado, mas considere copiar/colar; em alguns ambientes o `+` precisa virar `%2B` na URL. Para testes mais limpos, use `encode(..., 'base64url-equivalente')` substituindo os caracteres especiais.)

> Em produção real (a partir da Fase 6), o token será gerado pelo painel admin e enviado automaticamente por WhatsApp à paciente, sem precisar mexer em SQL.

---

## 7. Verificações de segurança

- [ ] Região do projeto = **São Paulo**
- [ ] RLS está habilitado em todas as tabelas (visível em **Authentication → Policies**)
- [ ] Apenas `service_role` consegue ler tabelas direto; `anon` só pode invocar as funções RPC públicas (`iniciar_acesso`, `definir_pin_e_consentir`, `validar_pin`, `obter_paciente_por_sessao`, `revogar_sessao`)
- [ ] `VITE_SUPABASE_ANON_KEY` é a chave **anon**, nunca a `service_role`

---

## 8. Próximos passos (Fase 2)

Com o backend funcionando:

1. Curadoria do conteúdo dos marcos da trilha (`marcos_trilha`) por procedimento. Substituir `[A SER PREENCHIDO PELO DR. TAIUÃ]` pelo conteúdo real dos seus cadernos.
2. Implementação da timeline visual no painel do paciente.
3. Integração de vídeos do YouTube (privacy-mode).
