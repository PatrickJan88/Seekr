fetch('http://localhost:3000/api/market-jobs')
  .then(res => res.json())
  .then(data => {
    const locs = data.jobs.map(j => j.candidate_required_location);
    console.log(Array.from(new Set(locs)).sort().join('\n'));
  })
  .catch(console.error);
