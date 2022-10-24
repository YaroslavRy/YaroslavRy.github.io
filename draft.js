
const loadData = async () => {
    const url = 'https://pokeapi.co/api/v2/pokemon/ditto';
    const res = await fetch(url);
    const data = await res.json();
    console.log(data);
}


// loadData();


// TODO: Differential equation solver

var f = function(x) {
    return x+x*3
}
const N = 100, t_0 = 0, t_1 = 1, y_0 = 2
const h = (t_1 - t_0) / N  //time step size
var ts = Array.from(Array(N+1), (_, k) => k * h + t_0)
var ys = Array(N+1).fill(0)  //empty array for the results
ys[0] = y_0  //initial conditions

for (let i = 0; i < N; i++) {
  ys[i + 1] =  ys[i] + f(ts[i], ys[i]) * h
  
}
console.log(ys);