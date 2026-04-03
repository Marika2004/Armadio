console.log("Funzioni.js caricato automaticamente!");
function eliminaDB() {
	if (!confirm("Sei sicuro di voler cancellare tutto il DB?")) return;

	db.close();
	const request = indexedDB.deleteDatabase("ArmadioDB");

	request.onsuccess = () => {
		alert("Database eliminato con successo");
	};

	request.onerror = () => {
		alert("Errore nell'eliminazione del database");
	};

	request.onblocked = () => {
		alert("Eliminazione bloccata (chiudi altre connessioni)");
	};

	db.open();
}

function salvaNuovoArticolo() {
	const Titolo = document.getElementById("Titolo").value;
	const Categoria = document.getElementById("Categoria").value;
	const Tipo = document.getElementById("Tipo").value;
	const Colore = document.getElementById("Colore").value;
	const Stagione = document.getElementById("Stagione").value;
	const file = document.getElementById("Foto").files[0];

	if (!file) return alert("Seleziona una foto");

	//Aggiungo al Table del BD la nuova IMMAGINE
	const reader = new FileReader();
	reader.onload = function () {
		const tx = db.transaction("vestiti", "readwrite");
		const store = tx.objectStore("vestiti");

		store.add({
			Immagine: reader.result
			, Titolo: Titolo
			, Categoria: Categoria
			, Tipo: Tipo
			, Colore: Colore
			, Stagione: Stagione
		});

		tx.oncomplete = () => {
			alert("Articolo inserito \nVisualizzalo nel armadio");

			//Svuoto campi
			document.getElementById("Titolo").value = "";
			document.getElementById("Categoria").value = "";
			document.getElementById("Tipo").value = "";
			document.getElementById("Colore").value = "";
			document.getElementById("Stagione").value = "";
			document.getElementById("Foto").value ="";
		};
	};

	reader.readAsDataURL(file);
}

function mostraArticoli() {
	let i = 0;

	//Titolo
	document.getElementById("title").textContent = "Miei articoli";	
	document.getElementById("sottoTitolo").textContent = "";

	//Mostro / Nascondo DIV
	document.getElementById("DivDettagliArticolo").style.display = "none";
	document.getElementById("mieiOutfit").style.display = "none";
	document.getElementById("mieiOutfit").innerHTML = "";
	document.getElementById("mieiArticoli").style.display = "block";
	document.getElementById("search").style.display = "block";
	document.getElementById("btnCreaOutfit").style.display = "none";

	const lista = document.getElementById("mieiArticoli");
	lista.innerHTML = "";

	const tx = db.transaction("vestiti", "readonly");
	const store = tx.objectStore("vestiti");
	
	//Passa tutti i vestiti e li mostra
	store.openCursor().onsuccess = function (e) {
	const cursor = e.target.result;
		
		if (!cursor) {
			//Quando ha finito il giro
			if (i == 0) {
				//Vuoto
				document.getElementById("sottoTitolo").textContent = "Nessun articolo caricato";
			}
			return;
		}

		const item = cursor.value;
		i++;

		const div = document.createElement("div");
		div.className = "col-6 col-md-2 d-flex flex-column p-2";
		div.innerHTML = `
						<img src="${item.Immagine}" class="rounded-2 " style="height:100px">

						<label style="position: absolute;">
						  <input type="checkbox" style="display: none;">
						  <span class="cuore">❤</span>
						</label>

						<div class="d-flex flex-column rounded-2 p-2" style="background-color:white">
							<span class="dynamic-text fw-bold">${item.Titolo}</span>
							<span class="dynamic-text">${item.Colore}</span>
							<span class="dynamic-text">${item.Categoria}</span>
						</div>
					`;

		lista.appendChild(div);

		// Doppio click
		div.addEventListener('dblclick', () => {
			idArticolo = item.id;

			//Titolo
			document.getElementById("title").textContent = "";
			document.getElementById("sottoTitolo").textContent = "";

			//Mostro / Nascondo DIV
			document.getElementById("DivDettagliArticolo").style.display = "block";
			document.getElementById("mieiOutfit").style.display = "none";
			document.getElementById("mieiOutfit").innerHTML = "";
			document.getElementById("mieiArticoli").style.display = "none";
			document.getElementById("mieiArticoli").innerHTML = "";
			document.getElementById("divModificaArticolo").style.display = "block";
			document.getElementById("divNuovoArticolo").style.display = "none";


			//Mostro Dettagli
			document.getElementById("Titolo").value = item.Titolo;
			document.getElementById("Titolo").disabled = true;
			document.getElementById("Categoria").value = item.Categoria;
			document.getElementById("Categoria").disabled = true;
			document.getElementById("Tipo").value = item.Tipo;
			document.getElementById("Tipo").disabled = true;
			document.getElementById("Colore").value = item.Colore;
			document.getElementById("Colore").disabled = true;
			document.getElementById("Stagione").value = item.Stagione;
			document.getElementById("Stagione").disabled = true;
			document.getElementById("Immagine").src = item.Immagine;
			document.getElementById("btnSalvaModificheArticolo").disabled = true;
			document.getElementById("search").style.display = "none";
			document.getElementById("btnCreaOutfit").style.display = "none";
		});

		cursor.continue();		  
	};
}

function eliminaArticolo() {

	if (!confirm("Sei sicuro di voler eliminare l'articolo? ")) { return; }

	//Salvo Id dei vari articoli 
	const tx = db.transaction("vestiti", "readwrite");
	const store = tx.objectStore("vestiti");

	//Elimino 1 sola riga
	store.delete(idArticolo);

	tx.oncomplete = () => {
		alert("Articolo eliminato");
		mostraArticoli();
	};
}

function modificaArticolo() {
	document.getElementById("btnModificaArticolo").disabled = true;
	document.getElementById("btnSalvaModificheArticolo").disabled = false;

	//Mostro Dettagli
	document.getElementById("Titolo").disabled = false;
	document.getElementById("Categoria").disabled = false;
	document.getElementById("Tipo").disabled = false;
	document.getElementById("Colore").disabled = false;
	document.getElementById("Stagione").disabled = false;

}

function salvaModificheArticolo() {
	//Salvo Modifiche Dettagli
	const Titolo = document.getElementById("Titolo").value;
	const Categoria = document.getElementById("Categoria").value;
	const Tipo = document.getElementById("Tipo").value;
	const Colore = document.getElementById("Colore").value;
	const Stagione = document.getElementById("Stagione").value;
	const Immagine = document.getElementById("Immagine").src;

	//Aggiorna 1 riga con Immagine
	const tx = db.transaction("vestiti", "readwrite");
	const store = tx.objectStore("vestiti");

	const articoloAggiornato = {
		id: idArticolo
		, Immagine: Immagine
		, Titolo: Titolo
		, Categoria: Categoria
		, Tipo: Tipo
		, Colore: Colore
		, Stagione: Stagione
	};

	store.put(articoloAggiornato);

	tx.oncomplete = () => {
		alert("Articolo modificato");
		mostraArticoli();
	};
}

function aggiungiArticolo() {
	//Titolo
	document.getElementById("title").textContent = "Aggiungi nuovo articolo";
	document.getElementById("sottoTitolo").textContent = "";

	//Mostro / Nascondo DIV
	document.getElementById("DivDettagliArticolo").style.display = "block";
	document.getElementById("mieiOutfit").style.display = "none";
	document.getElementById("mieiOutfit").innerHTML = "";
	document.getElementById("mieiArticoli").style.display = "none";
	document.getElementById("mieiArticoli").innerHTML = "";
	document.getElementById("sottoTitolo").style.display = "none";
	document.getElementById("divModificaArticolo").style.display = "none";
	document.getElementById("divNuovoArticolo").style.display = "block";
	document.getElementById("search").style.display = "none";
	document.getElementById("btnCreaOutfit").style.display = "none";

	//Svuoto e rendo editabili i campi
	document.getElementById("Titolo").value = "";
	document.getElementById("Titolo").disabled = false;
	document.getElementById("Categoria").value = "";
	document.getElementById("Categoria").disabled = false;
	document.getElementById("Tipo").value = "";
	document.getElementById("Tipo").disabled = false;
	document.getElementById("Colore").value = "";
	document.getElementById("Colore").disabled = false;
	document.getElementById("Stagione").value = "";
	document.getElementById("Stagione").disabled = false;
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

function mostraArticoliCliccabili() {
	let i = 0;

	//Titolo
	document.getElementById("title").textContent = "Seleziona piu articoli";
	document.getElementById("sottoTitolo").textContent = "";

	//Mostro / Nascondo DIV
	document.getElementById("DivDettagliArticolo").style.display = "none";
	document.getElementById("mieiOutfit").style.display = "none";
	document.getElementById("mieiOutfit").innerHTML = "";
	document.getElementById("mieiArticoli").style.display = "block";
	document.getElementById("search").style.display = "none";
	document.getElementById("btnCreaOutfit").style.display = "block";	

	const lista = document.getElementById("mieiArticoli");
	lista.innerHTML = "";

	const tx = db.transaction("vestiti", "readonly");
	const store = tx.objectStore("vestiti");

	arrayId = [];

	//Passa tutti i vestiti e li mostra
	store.openCursor().onsuccess = function (e) {
		const cursor = e.target.result;

		if (!cursor) {
			//Quando ha finito il giro
			if (i == 0) {
				//Vuoto
				document.getElementById("sottoTitolo").textContent = "Nessun articolo disponibile";
			}
			return;
		}

		const item = cursor.value;
		i++;

		const div = document.createElement("div");
		div.className = "col-6 col-md-2 d-flex flex-column p-2";
		div.innerHTML = `
			<div class="d-flex flex-column rounded-2 p-2" style="background-color:white">
				<img src="${item.Immagine}" class="rounded-2 " style="height:100px">				
				<span class="dynamic-text fw-bold">${item.Titolo}</span>
				<span class="dynamic-text">${item.Colore}</span>
				<span class="dynamic-text">${item.Categoria}</span>		
				<input type="checkbox" class="mb-2"></input>
			</div>
		`;

		lista.appendChild(div);

		const checkbox = div.querySelector('input[type="checkbox"]');

		checkbox.addEventListener('change', () => {

			if (checkbox.checked == true) {
				//Salvo ID
				arrayId.push(item.id);
			} else {
				//Tolgo ID
				arrayId = arrayId.filter(id => id !== item.id);
			}		
		});

		cursor.continue();
	};
}

function creaOutfit(arrayId) {

	if (arrayId.length < 2) {
		alert("Attenzione! Seleziona Più di 2 articoli");
		return;
	}

	//Salvo Id dei vari articoli 
	const tx = db.transaction("outfit", "readwrite");
	const store = tx.objectStore("outfit");

	store.add({
		IdArticoli: [...arrayId]
	});

	tx.oncomplete = () => {
		mostraOutfit();		
	};

	alert("Outfit Creato con successo!" + arrayId);
}

function mostraOutfit() {
	let i = 0;

	//Titolo
	document.getElementById("title").textContent = "Outfit creati";
	document.getElementById("sottoTitolo").textContent = "";

	//Mostro / Nascondo DIV
	document.getElementById("DivDettagliArticolo").style.display = "none";
	document.getElementById("mieiOutfit").style.display = "block";
	document.getElementById("mieiArticoli").style.display = "none"
	document.getElementById("mieiArticoli").innerHTML = "";
	document.getElementById("search").style.display = "none";
	document.getElementById("btnCreaOutfit").style.display = "none";

	const lista = document.getElementById("mieiOutfit");
	lista.innerHTML = "";

	const tx = db.transaction(["outfit", "vestiti"], "readonly");
	const storeOutfit = tx.objectStore("outfit");
	const storeArticolo = tx.objectStore("vestiti");

	//Passa tutti i vestiti e li mostra
	storeOutfit.openCursor().onsuccess = function (e) {
		const cursor = e.target.result;
		if (!cursor) {
			//Quando ha finito il giro
			if (i == 0) {
				//Vuoto
				document.getElementById("sottoTitolo").textContent = "Nessun outfit creato";
			}
			return;
		}
		const item = cursor.value;
		i++;

		//Div Che contiene gli Outfit
		const divGruppo = document.createElement("div");
		divGruppo.className = "row d-flex aling-item-center justify-content-center";
		divGruppo.innerHTML = `								
								<span class="dynamic-text">Outfit N ${i}</span>	
							`;		

		//salvo gli Id degli articoli per abbianre l'outfit
		let idArticoli = Array.isArray(item.IdArticoli)
			? item.IdArticoli
			: String(item.IdArticoli).split(",");

		idArticoli.forEach(id => {

			console.log("id songolo --> " + id);

			//Ottengo le riga con lo stesso ID
			const req = storeArticolo.get(Number(id));

			req.onsuccess = () => {
				const articolo = req.result;
				if (!articolo) return;

				const div = document.createElement("div");
				div.className = "col-6 col-md-2 d-flex flex-column p-2";
				div.innerHTML = `
									<img src="${articolo.Immagine}" class="rounded-2 " style="height:100px">	
									<div class="d-flex flex-column rounded-2 p-2" style="background-color:white">
										<span class="dynamic-text fw-bold">${articolo.Titolo}</span>
										<span class="dynamic-text">${articolo.Colore}</span>
										<span class="dynamic-text">${articolo.Categoria}</span>
									</div>
								`;
				divGruppo.appendChild(div);
			};
		});

		lista.appendChild(divGruppo);
		cursor.continue();
	};
}

//289
