# Trigger.dev jobs

## Sync research papers

### Steps

1. Schedule job by CRON expression

2. Fetch XML data from the [arxiv](https://arxiv.org/) webpage

3. If the fetch retruns with a status code 503, retry the fetch

4. Parse the incoming data

5. Add the research articles to the database
