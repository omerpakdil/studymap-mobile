-- Setup template for scheduling the send-notifications Edge Function with pg_cron + pg_net.
-- Run this in Supabase SQL Editor.
--
-- Official references:
-- https://supabase.com/docs/guides/functions/schedule-functions
-- https://supabase.com/docs/guides/cron
--
-- IMPORTANT:
-- Before running this file, enable these extensions in Supabase Dashboard:
-- Database -> Extensions -> `pg_cron` and `pg_net`.

-- 1. Remove an existing job if you are re-running setup.
do $$
begin
  perform cron.unschedule('send-notifications-hourly');
exception
  when others then
    null;
end
$$;

-- 2. Schedule the Edge Function.
-- Current cadence: every 3 hours, at minute 10.
select
  cron.schedule(
    'send-notifications-hourly',
    '10 */3 * * *',
    $$
    select
      net.http_post(
        url := 'https://fpilqiderbrxttnamjun.supabase.co/functions/v1/send-notifications',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwaWxxaWRlcmJyeHR0bmFtanVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwODI3MjYsImV4cCI6MjA3OTY1ODcyNn0.JeVUgaxM96MB5VCAiicGF0Zbl1niVBcBG8uIpCZnkrs'
        ),
        body := '{}'::jsonb
      ) as request_id;
    $$
  );

-- 3. Inspect scheduled jobs.
select jobid, jobname, schedule, active
from cron.job
where jobname = 'send-notifications-hourly';

-- 4. Inspect execution history.
select jobid, job_pid, status, return_message, start_time, end_time
from cron.job_run_details
where jobid in (
  select jobid from cron.job where jobname = 'send-notifications-hourly'
)
order by start_time desc
limit 20;
