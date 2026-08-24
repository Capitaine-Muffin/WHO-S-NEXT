create table public.salles (
  code text primary key check (char_length(code) = 6),
  hote uuid not null references auth.users(id) on delete cascade,
  statut text not null default 'attente',
  regles jsonb not null default '["whootchi"]'::jsonb,
  chrono smallint not null default 8 check (chrono between 1 and 8),
  animation text not null default 'normale' check (animation in ('normale', 'rapide', 'aucune')),
  creee_le timestamptz not null default now()
);

create table public.joueurs_salle (
  code_salle text not null references public.salles(code) on delete cascade,
  utilisateur uuid not null references auth.users(id) on delete cascade,
  nom text not null check (char_length(nom) between 1 and 18),
  avatar text not null default '🎤',
  ordre smallint not null,
  primary key (code_salle, utilisateur),
  unique (code_salle, ordre)
);

alter table public.salles enable row level security;
alter table public.joueurs_salle enable row level security;

create or replace function public.est_membre(p_code text) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from joueurs_salle where code_salle = p_code and utilisateur = auth.uid());
$$;

create policy "Voir sa salle" on public.salles for select to authenticated using (public.est_membre(code));
create policy "Voir les joueurs de sa salle" on public.joueurs_salle for select to authenticated using (public.est_membre(code_salle));

create or replace function public.code_salle_aleatoire() returns text
language plpgsql security definer set search_path = public as $$
declare resultat text;
begin
  loop
    resultat := upper(substr(md5(random()::text), 1, 6));
    exit when not exists (select 1 from salles where code = resultat);
  end loop;
  return resultat;
end $$;

create or replace function public.creer_salle(nom_joueur text, reglages jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare nouveau_code text := code_salle_aleatoire();
declare v_regles jsonb := coalesce(reglages->'regles', '["whootchi"]'::jsonb);
declare v_chrono smallint := least(8, greatest(1, coalesce((reglages->>'chrono')::smallint, 8)));
declare v_animation text := case when reglages->>'animation' in ('normale', 'rapide', 'aucune') then reglages->>'animation' else 'normale' end;
begin
  insert into salles(code, hote, regles, chrono, animation) values (nouveau_code, auth.uid(), v_regles, v_chrono, v_animation);
  insert into joueurs_salle(code_salle, utilisateur, nom, avatar, ordre) values (nouveau_code, auth.uid(), left(nom_joueur, 18), '🎤', 0);
  return jsonb_build_object('code', nouveau_code, 'hote', true, 'regles', v_regles, 'chrono', v_chrono, 'animation', v_animation,
    'joueurs', jsonb_build_array(jsonb_build_object('nom', left(nom_joueur, 18), 'avatar', '🎤')));
end $$;

create or replace function public.rejoindre_salle(p_code_salle text, nom_joueur text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare nombre integer;
declare resultat jsonb;
declare v_code text := upper(p_code_salle);
begin
  if not exists (select 1 from salles where code = v_code and statut = 'attente') then raise exception 'Cette partie est introuvable.'; end if;
  select count(*) into nombre from joueurs_salle where code_salle = v_code;
  if nombre >= 7 then raise exception 'Cette partie est complète.'; end if;
  insert into joueurs_salle(code_salle, utilisateur, nom, avatar, ordre)
  values (v_code, auth.uid(), left(nom_joueur, 18), (array['🎤','🎸','🥁','🎷','🎹','🎺','🪕'])[nombre + 1], nombre);
  select jsonb_build_object('code', s.code, 'hote', s.hote = auth.uid(), 'regles', s.regles, 'chrono', s.chrono, 'animation', s.animation,
    'joueurs', (select jsonb_agg(jsonb_build_object('nom', j.nom, 'avatar', j.avatar) order by j.ordre) from joueurs_salle j where j.code_salle = s.code))
  into resultat from salles s where s.code = v_code;
  return resultat;
end $$;

create or replace function public.regler_salle(p_code_salle text, reglages jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  update salles set
    regles = coalesce(reglages->'regles', regles),
    chrono = least(8, greatest(1, coalesce((reglages->>'chrono')::smallint, chrono))),
    animation = case when reglages->>'animation' in ('normale', 'rapide', 'aucune') then reglages->>'animation' else animation end
  where code = upper(p_code_salle) and hote = auth.uid() and statut = 'attente';
  if not found then raise exception 'Seul l’hôte peut modifier cette partie.'; end if;
end $$;

grant execute on function public.creer_salle(text, jsonb) to authenticated;
grant execute on function public.rejoindre_salle(text, text) to authenticated;
grant execute on function public.regler_salle(text, jsonb) to authenticated;

