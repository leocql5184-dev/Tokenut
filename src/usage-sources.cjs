function harnessDays(ledger) {
 const days={};for(const session of Object.values(ledger||{}))for(const [date,n]of Object.entries(session.days||{}))days[date]=(days[date]||0)+n;
 return days;
}
module.exports={harnessDays};
