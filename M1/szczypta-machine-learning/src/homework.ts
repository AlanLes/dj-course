import { addMatrices, multiplyMatrices, transpose, assertMatricesDimensionMatch, assertMatricesCompatible } from "./matrix-operations";
import { fromJSONFile, jsonFilePath, randomizeMatrix, randomizeVector } from "./utils";
import { vectorSum, dotProduct } from "./vector-operations";
import { Matrix, Vector } from "./types";
import { displayVector, displayMatrix } from "./display";

// HINT: (w zaleności od wybranego kierunku implementacji) może być mnożenie macierzy przez wektory - tę operację będzie trzeba zaimplementować 😉 
// ale nie jest to konieczne 😎

// HINT: w mnożeniu macierzy kolejność ma znaczenie - bo w zależności od kolejności albo wymiary obydwu składników pasują do siebie albo nie.

// HINT: wstań od komputera i przemyśl problem. Serio. Zastanów się, ile linijek wystarczy aby podać rozwiązanie :)
// (traktując "linijkę" jako pojedynczą operację na tensorach) 😎

// PROŚBA: jeśli znasz rozwiązanie, to nie spamuj discorda - a przynajmniej nie od razu. Pozwól innym pomóżdżyć 😎

const cases = [
  'case-1.json',
  'case-2.json',
  'case-3.json',
  'case-4.json'
];
const Q_Matrices: Matrix[] = [];
const K_Matrices: Matrix[] = [];
const S_Matrices: Matrix[] = [];  // S_Matrix[i][j] = dotProduct(Q_Matrix[i], K_Matrix[j])
for (const [index, filename] of cases.entries()) {
  const { WK_Matrix, WQ_Matrix, X_Input_Matrix } = fromJSONFile(jsonFilePath(filename));
  Q_Matrices.push(multiplyMatrices(X_Input_Matrix, WQ_Matrix));
  K_Matrices.push(multiplyMatrices(X_Input_Matrix, WK_Matrix));
  S_Matrices.push(multiplyMatrices(Q_Matrices[index], transpose(K_Matrices[index])));

  // console.log(`Q_Matrix ${index + 1}`);
  // console.log(displayMatrix(Q_Matrices[index], -1));
  // console.log(`K_Matrix ${index + 1}`);
  // console.log(displayMatrix(K_Matrices[index], -1));
  console.log(`S_Matrix ${index + 1}`);
  console.log(displayMatrix(S_Matrices[index], -1));
}
