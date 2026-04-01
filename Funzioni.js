console.log("RG_Function.js caricato automaticamente!");
	
function salva() {
  const Titolo = document.getElementById("Titolo").value;
  const Descrizione = document.getElementById("Descrizione").value;
  const Colore = document.getElementById("Colore").value;
  const Categoria = document.getElementById("Categoria").value;
  const file = document.getElementById("Foto").files[0];

  if (!file) return alert("Seleziona una foto");

  //Aggiungo al Table del BD la nuova IMMAGINE
  const reader = new FileReader();
  reader.onload = function () {
	const tx = db.transaction("vestiti", "readwrite");
	const store = tx.objectStore("vestiti");

	store.add({
		Immagine: reader.result
		,Titolo: Titolo
		,Descrizione: Descrizione
		,Colore: Colore
		,Categoria: Categoria
	});

	tx.oncomplete = () => {
	  carica();
	};
  };

  reader.readAsDataURL(file);
}

function carica() {
	  const lista = document.getElementById("lista");
	  lista.innerHTML = "";

	  const tx = db.transaction("vestiti", "readonly");
	  const store = tx.objectStore("vestiti");
	
	  //Passa tutti i vestiti e li mostra
	  store.openCursor().onsuccess = function (e) {
		const cursor = e.target.result;
		
		if (!cursor) return; 
		
		  const item = cursor.value;

		  const div = document.createElement("div");
		  div.className = "col-12 col-md-2 d-flex flex-column p-4";
		  div.innerHTML = `			
			<img src="${item.Immagine}">
			<span class="dynamic-text fw-bold">${item.Titolo}</span>
			`;

		  lista.appendChild(div);
				
		  div.addEventListener('click', () => {
			  alert("Titolo: " + item.Titolo + 
					"\nDescrizione: " + item.Descrizione + 
					"\nColore: " + item.Colore + 
					"\nCategoria: " + item.Categoria 
			  );
		  });
		
		  cursor.continue();
		  
		  
		  
	  };
}

function exportJson() {
		
	  const tx = db.transaction("vestiti", "readonly");
	  const store = tx.objectStore("vestiti");
	
	  const tuttiVestiti = [];
	
	  //Passa tutti i vestiti e li mostra
	  store.openCursor().onsuccess = function (e) {
		const cursor = e.target.result;
		
		//Salvo tutti i dati in un JSON
		if (cursor) {
            tuttiVestiti.push(cursor.value);
            cursor.continue();
        } else {
            // Qui tutti i vestiti sono stati raccolti
            const jsonString = JSON.stringify(tuttiVestiti, null, 2);            
            alert("JSON --> " + jsonString);
            console.log("JSON --> " + jsonString);
        }
		
	  };
}

function elimina() {
  if (!confirm("Sei sicuro di voler cancellare tutti i vestiti?")) return;

  const tx = db.transaction("vestiti", "readwrite");
    const store = tx.objectStore("vestiti");

	// cancella tutti i record
    store.clear(); 

	// ricarica la lista, ora vuota
    tx.oncomplete = () => {
        carica(); 
        alert("Tutti i vestiti sono stati eliminati!");
    };

    tx.onerror = (e) => {
        console.error("Errore durante la cancellazione:", e.target.error);
    };
}
