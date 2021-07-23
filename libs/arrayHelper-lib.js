export function remove(arr, value) {
  for( var i = 0; i < arr.length; i++){
		console.log(arr[i]);
    if ( arr[i] == value) {
        arr.splice(i, 1);
        i--;
    }
  }
}
