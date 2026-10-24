alter table public.prompts
  add column if not exists image_variations jsonb not null default '[]'::jsonb;

alter table public.prompts
  add constraint prompts_image_variations_limit check (
    case
      when jsonb_typeof(image_variations) = 'array' then jsonb_array_length(image_variations) <= 5
      else false
    end
  );

create or replace function public.prompt_image_variations_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.image_variations is distinct from old.image_variations then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists prompts_image_variations_updated_at_trg on public.prompts;
create trigger prompts_image_variations_updated_at_trg
  before update of image_variations on public.prompts
  for each row execute function public.prompt_image_variations_updated_at();
