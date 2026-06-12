-- Server-side aggregate for the dashboard's "top customers by report count".
-- Replaces the client downloading every report_forms row (with nested
-- construction -> customer joins) just to compute a top-3 list.
--
-- security invoker: runs with the calling user's RLS, so it returns exactly
-- what the previous client-side aggregation over report_forms could see.

create or replace function public.get_dashboard_customer_stats(p_limit integer default 3)
returns table (
    id text,
    name text,
    count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
    select
        cu.id::text as id,
        cu.name as name,
        count(rf.id)::bigint as count
    from report_forms rf
    join constructions c on c.id = rf.construction_id
    join customers cu on cu.id = c.customer_id
    group by cu.id, cu.name
    order by count desc, cu.name asc
    limit greatest(p_limit, 1);
$$;

grant execute on function public.get_dashboard_customer_stats(integer) to authenticated;
