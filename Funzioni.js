
console.log("Funzioni.js caricato automaticamente!");

//--------------------------------------------------------------------------------------- FUNZIONI ARTICOLO 
window.salvaNuovoArticolo = async function () {

	const Titolo = document.getElementById("Titolo").value;
	const Categoria = document.getElementById("Categoria").value;
	const Tipo = document.getElementById("Tipo").value;
	const Colore = document.getElementById("Colore").value;
	const Stagione = document.getElementById("Stagione").value;
	const file = document.getElementById("Foto").files[0];

	if (!file) {
		alert("Seleziona una foto");
		return;
	}

	document.getElementById("pageOverlay").style.display = "flex";

	try {
		//Carico Foto
		const fileName = Date.now() + "_" + file.name

		await client.storage
			.from("ImageArticoli")
			.upload(fileName, file)

		const { data } = client.storage
			.from("ImageArticoli")
			.getPublicUrl(fileName)

		const imageUrl = data.publicUrl

		//Salvo Row
		await client
			.from('Articoli')
			.insert([{
				Titolo: Titolo,
				Categoria: Categoria,
				Tipo: Tipo,
				Colore: Colore,
				Stagione: Stagione,
				Preferita: false,
				Immagine: imageUrl
			}])

		alert("Articolo salvato!");
		mostraToast("Salvato con successo", "success");

		// reset campi
		document.getElementById("Titolo").value = "";
		document.getElementById("Foto").value = "";


	} catch (err) {
		console.error(err);
		alert("Errore salvataggio");
	}
	document.getElementById("pageOverlay").style.display = "none";
}

window.mostraArticoli = async function () {
	const { data } = await client
		.from('Articoli')
		.select('*')

	const lista = document.getElementById('lista')
	lista.innerHTML = ''

	data.forEach(item => {

		const li = document.createElement('li')
		li.innerHTML = `
                <div>
			<b>${item.Titolo}</b> - ${item.Categoria}
			<br>
			<img src="${item.Immagine}" width="120">
			</div>                       
  		`

		lista.appendChild(li)
	})
}

window.visualizzaArticoli = async function (IdLista, table, tipoS) {
	
	let { data } = await client
		.from(table)
		.select('*')

	const lista = document.getElementById(IdLista);
	lista.innerHTML = "";

	//Se non ho ROW
	if (data.length == 0) {
		switch (tipoS) {
			case "MioArmadio":
				document.getElementById("sottoTitolo").textContent = "Nessun articolo caricato";
				break;
			case "ArticoliSelezionabili":
				arrayId = [];

				document.getElementById("sottoTitolo").textContent = "Nessun articolo disponibile";
				break;
			case "ArticoliPreferiti":
				document.getElementById("sottoTitolo").textContent = "Nessun articolo PREFERITO caricato";
				break;
			case "ModificaArticoliSelezionabili":
				document.getElementById("sottoTitolo").textContent = "Nessun articolo disponibile";
				break;
		}
	}

	if (tipoS === "ArticoliSelezionabili") {
		arrayId = [];

		let divDati = divDatiOutfit();
		lista.appendChild(divDati);

		const titoloOutfit = divDati.querySelector('input[type="text"]');
		const dataOutfit = divDati.querySelector('input[type="date"]');	

		titoloOutfit.addEventListener('input', () => {
			TitoloOutfit = titoloOutfit.value;
		});

		titoloOutfit.addEventListener('change', () => {
			DataOutfit = dataOutfit.value;
		});
	}

	//Passa tutti i vestiti e li mostra
	data.forEach(item => {

		// Stampo i DIV adatti
		let div = divArticolo(tipoS, item);

		if (tipoS === "ArticoliPreferiti") {
			if (item.Preferita) {
				lista.appendChild(div);
			}
		} else if (tipoS === "FiltroArticoli") {

			if (
				(categoriaValue == "" || item.Categoria === categoriaValue) &&
				(tipoValue == "" || item.Tipo === tipoValue) &&
				(coloreValue == "" || item.Colore === coloreValue) &&
				(stagioneValue == "" || item.Stagione === stagioneValue)
			) {
				lista.appendChild(div);
			}

		} else if (tipoS === "FiltroTitolo") {

			//Mostro solo quelli che contengono il VALUE nel Titolo
			let filetTitle = document.getElementById("filterTitle").value;

			if (filetTitle === "") {
				lista.appendChild(div);
			} else if (item.Titolo.includes(filetTitle)) {
				lista.appendChild(div);
			}

		} else {
			lista.appendChild(div);
		}

		// Doppio click
		div.addEventListener('dblclick', () => {
			idArticolo = item.IdArticolo;

			visualizzaDiv("VisualizzaArticolo");

			//Popola Select --> IdSelect , DefaultValue, array
			popolaSelect("Categoria", item.Categoria, categoria);
			popolaSelect("Tipo", item.Tipo, tipo);
			popolaSelect("Colore", item.Colore, colore);
			popolaSelect("Stagione", item.Stagione, stagione);

			//Mostro Dettagli
			document.getElementById("Titolo").value = item.Titolo;
			document.getElementById("Titolo").disabled = true;
			document.getElementById("Categoria").disabled = true;
			document.getElementById("Tipo").disabled = true;
			document.getElementById("Colore").disabled = true;
			document.getElementById("Stagione").disabled = true;
			document.getElementById("Immagine").src = item.Immagine;
			document.getElementById("btnSalvaModificheArticolo").disabled = true;
			document.getElementById("btnCreaOutfit").style.display = "none";
			document.getElementById("btnArticoliPreferiti").style.display = "none";
		});

		//Metto tra i preferiti
		const checkbox = div.querySelector('input[type="checkbox"]');

		checkbox.addEventListener('change', () => {
			idArticolo = item.IdArticolo;

			switch (tipoS) {
				case "MioArmadio":
				case "ArticoliPreferiti":
				case "FiltroArticoli":

					//Salva Modifiche
					salvaModificheArticolo(tipoS, checkbox.checked);

					break;
				case "ArticoliSelezionabili":

					if (checkbox.checked == true) {
						//Salvo ID
						arrayId.push(item.IdArticolo);
					} else {
						//Tolgo ID
						arrayId = arrayId.filter(id => id !== item.IdArticolo);
					}

					break;
				case "ModificaArticoliSelezionabili":

					if (checkbox.checked == true) {
						//Salvo ID
						arrayId.push(item.IdArticolo);
					} else {
						//Tolgo ID
						arrayId = arrayId.filter(id => id !== item.IdArticolo);
					}

					break;
			}
		});
	})
}

window.eliminaArticolo = async function () {

	if (!confirm("Sei sicuro di voler eliminare l'articolo? ")) { return; }

	//Elimino la ROW
	const { data, error } = await client
		.from('Articoli')
		.delete()
		.eq('IdArticolo', idArticolo)

	if (error) {
		console.error(error);
		mostraToast("Errore eliminazione", "error");
		return;
	}

	mostraToast("Articolo eliminato", "success");

	//Mostro i Div che servono
	visualizzaDiv("MioArmadio");

	//mostraArticoli();
	visualizzaArticoli("mieiArticoli", "Articoli", "MioArmadio");
}

window.salvaModificheArticolo = async function (tipoS, preferita) {

	switch (tipoS) {
		case "ArticoliPreferiti":
		case "MioArmadio":
		case "FiltroArticoli":

			//Salvo Row
			await client
				.from('Articoli')
				.update({
					Preferita: preferita
				})
				.eq('IdArticolo', idArticolo)

		case "BtnSalva":
			//Salvo Modifiche Dettagli
			const Titolo = document.getElementById("Titolo").value;
			const Categoria = document.getElementById("Categoria").value;
			const Tipo = document.getElementById("Tipo").value;
			const Colore = document.getElementById("Colore").value;
			const Stagione = document.getElementById("Stagione").value;
			const Immagine = document.getElementById("Immagine").src;

			await client
				.from('Articoli')
				.update({
					Immagine: Immagine
					, Titolo: Titolo
					, Categoria: Categoria
					, Tipo: Tipo
					, Colore: Colore
					, Stagione: Stagione
					, Preferita: preferita
				})
				.eq('IdArticolo', idArticolo)
							
			break;
	}
	
	//riagiorno la vista degli articoli
	if (tipoS === "ArticoliPreferiti") {

		visualizzaArticoli("mieiArticoli", "Articoli", "ArticoliPreferiti");

	} else if (tipoS === "MioArmadio") {

		//Mostro i Div che servono
		visualizzaDiv("MioArmadio");

		visualizzaArticoli("mieiArticoli", "Articoli", "MioArmadio");

	} else if (tipoS === "BtnSalva") {

		mostraToast("Articolo modificato", "success");

		//Mostro i Div che servono
		visualizzaDiv("MioArmadio");

		visualizzaArticoli("mieiArticoli", "Articoli", "MioArmadio");
	}
}

window.modificaArticolo = function () {
	//Mostro Dettagli
	document.getElementById("Titolo").disabled = false;
	document.getElementById("Categoria").disabled = false;
	document.getElementById("Tipo").disabled = false;
	document.getElementById("Colore").disabled = false;
	document.getElementById("Stagione").disabled = false;
}

window.aggiungiArticolo = function () {
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

window.divArticolo = function (tipoS, item) {

	let trovaId = tipoS === "ModificaArticoliSelezionabili" ? arrayId.filter(id => id == item.IdArticolo) : null;

	let div = document.createElement("div")
	div.className = "col-6 col-md-2 d-flex flex-column p-2";
	div.innerHTML = `
					${tipoS === "ArticoliSelezionabili" || tipoS === "ModificaArticoliSelezionabili" ? '<div class="d-flex flex-column rounded-2 p-2" style="background-color:white">' : ''}
					<img src="${item.Immagine}" class="rounded-2 " style="height:200px">

					${tipoS === "MioArmadio" || tipoS === "ArticoliPreferiti" || tipoS === "FiltroArticoli" || tipoS === "FiltroTitolo" ? `
					<label style="position: absolute;">
						<input type="checkbox" style="display: none;" ${item.Preferita ? "checked" : ""}>
						<span class="cuore">${item.Preferita ? "❤️" : "❤"}</span>
					</label>
					` : ''} 

					<div class="d-flex flex-column rounded-2 p-2" style="background-color:white">
						<span class="dynamic-text fw-bold">${item.Titolo}</span>
						<span class="dynamic-text">${item.Colore}</span>
						<span class="dynamic-text">${item.Categoria}</span>
						${tipoS === "ArticoliSelezionabili" || tipoS === "ModificaArticoliSelezionabili" ? `<input type="checkbox" class="mb-2" ${tipoS === "ModificaArticoliSelezionabili" && trovaId && trovaId.length > 0 ? "checked" : ""}>` : ''}

					</div>
					${tipoS === "ArticoliSelezionabili" || tipoS === "ModificaArticoliSelezionabili" ? '</div>' : ''}
				`;

	return div;

}

window.divOutfit_Articolo = function (tipoS, item) {

	let div = document.createElement("div")
	div.className = "col-6 col-md-2 d-flex flex-column p-2";
	div.innerHTML = `
					<img src="${item.Articoli.Immagine}" class="rounded-2 " style="height:200px">
						
					<div class="d-flex flex-column rounded-2 p-2" style="background-color:white">
						<span class="dynamic-text fw-bold">${item.Articoli.Titolo}</span>
						<span class="dynamic-text">${item.Articoli.Colore}</span>
						<span class="dynamic-text">${item.Articoli.Categoria}</span>
					</div>
				`;
	return div;
}
//--------------------------------------------------------------------------------------- FUNZIONI OUTFIT 
window.visualizzaOutfit = async function (daBtn) {
	let i = 0;
	const oggi = new Date().toISOString().split('T')[0];

	//Prendo solo gli Outfit con la data di oggi
	let query = client
		.from('Outfit')
		.select(`
		*,
		Outfit_Articoli(
			Articoli(*)
		)
	`);

	if (!daBtn) {
		query = query.eq('DataUtilizzo', oggi);
	}

	const { data: outfitArticoliTable, error } = await query;
		
	if (error) {
		console.error(error);
	} else {
		console.log(outfitArticoliTable);
	}

	const lista = document.getElementById("mieiOutfit");
	lista.innerHTML = "";

	if (outfitArticoliTable.length == 0) {
		document.getElementById("sottoTitolo").textContent = "Nessun outfit creato";
	}

	//Passa tutti gli Outfit e li mostra
	outfitArticoliTable.forEach(outfit => {		

		//Div Che contiene gli Outfit
		const divGruppo = document.createElement("div");
		divGruppo.className = "row d-flex aling-items-center justify-content-center";
		divGruppo.innerHTML = `	
								<div class="col-12 d-flex flex-row justify-content-between p-2 gap-2">
									<span class="dynamic-text">Outfit N° ${i} - ${outfit.Titolo}</span>	
									<div>
										<button id="btnDuplicaOutfit" class="btn dynamic-btn btn-success p-2">📚 Duplica</button>
										<button id="btnModificaOutfit" class="btn dynamic-btn btn-success p-2">✏️ Modifica</button>
										<button id="btnEliminaOutfit" class="btn dynamic-btn btn-success p-2">🗑️ Elimina</button>
									</div>
								</div>
							`;

		//Posiziono tutti gli articolo per questo Outfit
		outfit.Outfit_Articoli.forEach(articoli => {
			let div = divOutfit_Articolo("Outfit", articoli);
			divGruppo.appendChild(div); if (!articoli) return;
			lista.appendChild(divGruppo);
		});

		//Gestisco i click dei BTN
		const btnDuplica = divGruppo.querySelector('#btnDuplicaOutfit');
		const btnModifica = divGruppo.querySelector('#btnModificaOutfit');
		const btnElimina = divGruppo.querySelector('#btnEliminaOutfit');

		btnDuplica.addEventListener('click', async () => {
						
			//Ottengo le riga con lo stesso ID
			let articoli = outfitArticoliTable.find(item => item.IdOutfit == outfit.IdOutfit);

			//Copio le righe
			const { data, error } = await client
				.from('Outfit')
				.insert([{
					Titolo: outfit.Titolo,
					DataUtilizzo: outfit.DataUtilizzo
				}])
				.select() //ritorna la riga creata
				.single() //ne ho creato solo 1

			if (error) {
				console.error(error);
				mostraToast("Errore nella creazione del outfit", "error");
				return;
			}

			//No foreach perche ho un Async
			for (let item of articoli.Outfit_Articoli) {
				const { error: error1 } = await client
					.from('Outfit_Articoli')
					.insert([{
						IdOutfit: data.IdOutfit,
						IdArticolo: item.Articoli.IdArticolo
					}]);

				if (error1) {
					console.error(error1);
					mostraToast("Errore nella creazione del Outfit_Articoli " + error1, "error");
					return;
				}
			}

			alert("Outfit Duplicato con successo!");
			
			visualizzaDiv("Outfit");
			visualizzaOutfit(false);
		});

		btnModifica.addEventListener('click', async () => {

			////Mostro il nuovo Outft con flag su articoli già presenti
			idOutfit = item.IdOutfit;
			arrayId = item.IdArticolo;

			console.log(arrayId + "arrayId")

			visualizzaDiv("ModificaArticoliSelezionabili");

			visualizzaArticoli("mieiArticoli", "Articoli", "ModificaArticoliSelezionabili");
		});

		btnElimina.addEventListener('click', async () => {

			//Elimino la ROW (Prima elimino i Figli e dopo il Padre)

			const { error: error1 } = await client
				.from('Outfit_Articoli')
				.delete()
				.eq('IdOutfit', outfit.IdOutfit);

			if (error1) {
				console.error(error1);
				mostraToast("Errore nella creazione del Outfit_Articoli", "error");
				return;
			}

			const { error } = await client
				.from('Outfit')
				.delete()
				.eq('IdOutfit', outfit.IdOutfit);

			if (error) {
				console.error(error);
				mostraToast("Errore nella creazione del Outfit", "error");
				return;
			}				

			alert("Outfit Eliminato con successo!");
			
			visualizzaDiv("Outfit");
			visualizzaOutfit(true);
		});

		i++;
	});
}

window.creaOutfit = async function (arrayId) {

	if (arrayId.length < 2) {
		alert("Attenzione! Seleziona Più di 2 articoli");
		return;
	}

	//Creo Outfit Row
	const { data, error } = await client
		.from('Outfit')
		.insert([{
			Titolo: TitoloOutfit,
			DataUtilizzo: DataOutfit
		}])
		.select() //ritorna la riga creata
		.single() //ne ho creato solo 1

	if (error) {
		console.error(error);
		mostraToast("Errore nella creazione del outfit", "error");
		return;
	}

	//No foreach perche ho un Async
	for (let item of arrayId) {
		const { data: outfitArticoliTable, error } = await client
			.from('Outfit_Articoli')
			.insert([{
				IdOutfit: data.IdOutfit,
				IdArticolo: item
			}]);

		if (error) {
			console.error(error);
			mostraToast("Errore nella creazione del Outfit_Articoli", "error");
			return;
		}
	}
	

	//svuota l'array
	arrayId.length = 0;

	visualizzaDiv("Outfit");
	
	visualizzaOutfit(true);
	
	alert("Outfit Creato con successo!" + arrayId);
}

window.salvaModificheOutfit = async function (arrayId) {

	if (arrayId.length < 2) {
		alert("Attenzione! Seleziona Più di 2 articoli");
		return;
	}

	//Salvo Id dei vari articoli
	await client
		.from('Outfit')
		.update({
			IdArticoli: arrayId
		})
		.eq('IdOutfit', idOutfit)

	alert("Outfit Modificato con successo!");

	visualizzaDiv("Outfit");
	visualizzaOutfit(true);
}

window.divDatiOutfit = function () {

	let div = document.createElement("div")
	div.className = "row";
	div.innerHTML = `
					<div class="col-2 d-flex align-items-center justify-content-start flex-row p-2">
						<span class="dynamic-text fw-bold" style="width: 45px;">Data</span>
						<input type="date" id="Titolo" class="dynamic-text form-control">
					</div>
					<div class="col-5 d-flex align-items-center justify-content-start flex-row p-2">
						<span class="dynamic-text fw-bold" style="width: 110px;">Titolo Outfit</span>
						<input type="text" id="Titolo" class="dynamic-text form-control">
					</div>					
				`;

	return div;

}
	
//--------------------------------------------------------------------------------------- FUNZIONI VARIE
window.visualizzaDiv = function(tipoS) {

	switch (tipoS) {
		case "MioArmadio":

			//Titolo
			document.getElementById("title").textContent = "Miei articoli";
			document.getElementById("sottoTitolo").textContent = "";

			//Mostro / Nascondo DIV
			document.getElementById("DivDettagliArticolo").style.display = "none";
			document.getElementById("mieiOutfit").style.display = "none";
			document.getElementById("mieiOutfit").innerHTML = "";
			document.getElementById("mieiArticoli").style.display = "block";
			document.getElementById("btnCreaOutfit").style.display = "none";
			document.getElementById("btnArticoliPreferiti").style.display = "block";
			document.getElementById("divFiltri").classList.remove("d-none");
			document.getElementById("divFiltroCerca").classList.remove("d-none");

			break;
		case "ModificaArticolo":

			document.getElementById("btnModificaArticolo").disabled = true;
			document.getElementById("btnSalvaModificheArticolo").disabled = false;

			break;
		case "AggiungiArticolo":

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
			document.getElementById("btnCreaOutfit").style.display = "none";
			document.getElementById("btnArticoliPreferiti").style.display = "none";
			document.getElementById("divFiltri").classList.add("d-none");
			document.getElementById("divFiltroCerca").classList.add("d-none");
			break;
		case "ArticoliSelezionabili":
			//Titolo
			document.getElementById("title").textContent = "Seleziona piu articoli";
			document.getElementById("sottoTitolo").textContent = "";

			//Mostro / Nascondo DIV
			document.getElementById("DivDettagliArticolo").style.display = "none";
			document.getElementById("mieiOutfit").style.display = "none";
			document.getElementById("mieiOutfit").innerHTML = "";
			document.getElementById("mieiArticoli").style.display = "block";
			document.getElementById("btnArticoliPreferiti").style.display = "none";
			document.getElementById("divFiltri").classList.add("d-none");
			document.getElementById("divFiltroCerca").classList.add("d-none");
			document.getElementById("btnCreaOutfit").style.display = "block";
			document.getElementById("btnModificaOutfit").style.display = "none";
			break;
		case "Outfit":
			//Titolo
			document.getElementById("title").textContent = "Outfit creati";
			document.getElementById("sottoTitolo").textContent = "";

			//Mostro / Nascondo DIV
			document.getElementById("DivDettagliArticolo").style.display = "none";
			document.getElementById("mieiOutfit").style.display = "block";
			document.getElementById("mieiArticoli").style.display = "none"
			document.getElementById("mieiArticoli").innerHTML = "";
			document.getElementById("btnCreaOutfit").style.display = "none";
			document.getElementById("btnArticoliPreferiti").style.display = "none";
			document.getElementById("divFiltri").classList.add("d-none");
			document.getElementById("divFiltroCerca").classList.add("d-none");

			break;
		case "ArticoliPreferiti":
			document.getElementById("btnArticoliPreferiti").style.display = "none";
			document.getElementById("divFiltri").classList.add("d-none");
			document.getElementById("divFiltroCerca").classList.add("d-none");
			break;
		case "VisualizzaArticolo":

			//Titolo
			document.getElementById("title").textContent = "";
			document.getElementById("sottoTitolo").textContent = "";

			//Mostro / Nascondo DIV
			document.getElementById("DivDettagliArticolo").style.display = "block";
			document.getElementById("mieiOutfit").style.display = "none";
			document.getElementById("mieiOutfit").innerHTML = "";
			document.getElementById("mieiArticoli").style.display = "none";
			document.getElementById("mieiArticoli").innerHTML = "";
			document.getElementById("sottoTitolo").style.display = "none";
			document.getElementById("divModificaArticolo").style.display = "block";
			document.getElementById("divNuovoArticolo").style.display = "none";
			document.getElementById("btnCreaOutfit").style.display = "none";
			document.getElementById("btnArticoliPreferiti").style.display = "none";
			document.getElementById("divFiltri").classList.add("d-none");
			document.getElementById("divFiltroCerca").classList.add("d-none");
			break;
		case "ModificaArticoliSelezionabili":
			//Titolo
			document.getElementById("title").textContent = "Seleziona piu articoli";
			document.getElementById("sottoTitolo").textContent = "";

			//Mostro / Nascondo DIV
			document.getElementById("DivDettagliArticolo").style.display = "none";
			document.getElementById("mieiOutfit").style.display = "none";
			document.getElementById("mieiOutfit").innerHTML = "";
			document.getElementById("mieiArticoli").style.display = "block";
			document.getElementById("btnArticoliPreferiti").style.display = "none";
			document.getElementById("divFiltri").classList.add("d-none");
			document.getElementById("divFiltroCerca").classList.add("d-none");
			document.getElementById("btnCreaOutfit").style.display = "none";
			document.getElementById("btnModificaOutfit").style.display = "block";

			break;
	}
}

window.popolaSelect = function (idSelect, defaultOption, array) {

	let select = document.getElementById(idSelect);
	select.innerHTML = "";

	array.forEach(item => {
		let option = document.createElement("option");

		option.value = item;
		option.textContent = item;

		//Default
		if (defaultOption === item) {
			option.selected = true;
			option.disabled = true;
		}

		select.appendChild(option);
	});
}

window.mostraToast = function (messaggio, tipo = "success") {
	const toastEl = document.getElementById("liveToast");
	const toastBody = document.getElementById("toastMessage");

	toastBody.textContent = messaggio;

	// cambia colore (success, danger, warning, info)
	toastEl.className = "toast align-items-center text-bg-" + tipo + " border-0";

	const toast = new bootstrap.Toast(toastEl);
	toast.show();
}

window.login = async function () {
	const email = document.getElementById("email").value;
	const password = document.getElementById("password").value;

	const { error } = await client.auth.signInWithPassword({
		email,
		password
	});

	if (error) {
		alert("Errore login");
		return;
	}

	document.getElementById("loginDiv").style.display = "none";

	// fai partire app
	visualizzaDiv("Outfit");
	visualizzaOutfit(false);
}

//675
