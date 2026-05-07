-- =====================================================================
-- Seed inicial — placeholders dos marcos da trilha
-- =====================================================================
-- IMPORTANTE: o conteúdo (descricao_md, exercicios, vídeos, sinais)
-- é PLACEHOLDER e DEVE ser revisto/substituído pelo Dr. Taiuã antes
-- de qualquer paciente real receber o app.
-- =====================================================================

-- Limpa marcos previamente inseridos para idempotência ----------------
delete from marcos_trilha where titulo like '[PLACEHOLDER]%';

-- Marcos comuns (D+1, D+3, D+7, D+15, D+30, D+45, D+60, D+90) ---------
-- Inserimos um conjunto idêntico para cada procedimento. O Dr. Taiuã
-- diferencia o conteúdo de cada um na fase de curadoria.

do $$
declare
  proc procedimento_tipo;
  dias int[] := array[1, 3, 7, 15, 30, 45, 60, 90];
  d int;
  ord int;
  proc_label text;
begin
  for proc in select unnest(enum_range(null::procedimento_tipo)) loop
    proc_label := case proc
      when 'ATQ_POSTERIOR' then 'ATQ posterior'
      when 'ATQ_ANTERIOR'  then 'ATQ anterior'
      when 'ARTROSCOPIA'   then 'Artroscopia'
    end;

    ord := 0;
    foreach d in array dias loop
      ord := ord + 1;
      insert into marcos_trilha (
        procedimento, dia_pos_op, titulo, descricao_md,
        video_youtube_id, exercicios, sinais_alarme_md, ordem
      ) values (
        proc,
        d,
        format('[PLACEHOLDER] %s — D+%s', proc_label, d),
        format(
          E'## Marco D+%s — %s\n\n[A SER PREENCHIDO PELO DR. TAIUÃ]\n\n'
          'Este texto é apenas estrutura. Substituir pelo conteúdo curado '
          'do caderno pós-operatório correspondente.',
          d, proc_label
        ),
        null,
        '[]'::jsonb,
        E'## Sinais de alerta\n\n[A SER PREENCHIDO PELO DR. TAIUÃ]',
        ord
      );
    end loop;
  end loop;
end$$;

-- Confirmação de carga -----------------------------------------------
do $$
declare
  qtd int;
begin
  select count(*) into qtd from marcos_trilha;
  raise notice 'Marcos da trilha cadastrados: %', qtd;
end$$;
