-- Ensure schema graphql exists and enable pg_graphql extension
CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;

-- Wrapper function in public schema so PostgREST resolves /graphql/v1 cleanly
CREATE OR REPLACE FUNCTION public.graphql(
    "operationName" text DEFAULT NULL::text,
    query text DEFAULT NULL::text,
    variables jsonb DEFAULT NULL::jsonb,
    extensions jsonb DEFAULT NULL::jsonb
)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
AS $$
    SELECT graphql_public.graphql(
        "operationName" := "operationName",
        query := query,
        variables := variables,
        extensions := extensions
    );
$$;

GRANT EXECUTE ON FUNCTION public.graphql TO anon, authenticated, service_role;
