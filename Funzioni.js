
console.log("Funzioni.js caricato automaticamente!");

//--------------------------------------------------------------------------------------- FUNZIONI ARTICOLO 
window.InserisciNuovoArticolo = async function () {

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
				Immagine: imageUrl,
				UteIns: currentUser.id
			}])

		mostraToast("Salvato con successo", "success");

		//Rimostro gli articoli aggiornati
		visualizzaArticoli("mieiArticoli", "Articoli", "MioArmadio");

		DettagliArticoloModal("InserisciArticolo");

	} catch (err) {
		console.error(err);
		alert("Errore salvataggio");
	}
	document.getElementById("pageOverlay").style.display = "none";
}

window.EliminaArticolo = async function () {

	if (!confirm("Sei sicuro di voler eliminare l'articolo? ")) { return; }

	document.getElementById("pageOverlay").style.display = "flex";

	//Elimino la ROW
	const { data, error } = await client
		.from('Articoli')
		.delete()
		.eq('IdArticolo', idArticolo)

	if (error) {
		console.error(error);
		mostraToast("Errore eliminazione", "danger");
		return;
	}

	mostraToast("Articolo eliminato", "success");

	//Mostro i Div che servono
	visualizzaDiv("MioArmadio");

	visualizzaArticoli("mieiArticoli", "Articoli", "MioArmadio");

	document.getElementById("pageOverlay").style.display = "none";
}

window.SalvaModificheArticolo = async function (tipoS, preferita) {

	document.getElementById("pageOverlay").style.display = "flex";

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
			break;
		case "BtnSalva":
			//Salvo Modifiche Dettagli
			const Titolo = document.getElementById("Titolo").value;
			const Categoria = document.getElementById("Categoria").value;
			const Tipo = document.getElementById("Tipo").value;
			const Colore = document.getElementById("Colore").value;
			const Stagione = document.getElementById("Stagione").value;
			let Immagine = document.getElementById("preview").src;	//Quella già salvata
			const file = document.getElementById("Foto").files[0];

			//Cambio Img se è stata cambiata
			if (file) {
				const fileName = Date.now() + "_" + file.name;

				await client.storage
					.from("ImageArticoli")
					.upload(fileName, file);

				const { data } = client.storage
					.from("ImageArticoli")
					.getPublicUrl(fileName);

				Immagine = data.publicUrl;
			}

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

	document.getElementById("pageOverlay").style.display = "none";
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

		dataOutfit.addEventListener('change', () => {
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

			//apro il modal
			const modal = new bootstrap.Modal(document.getElementById('dettagliArticoloModal'));
			modal.show();

			DettagliArticoloModal("VisualizzaArticolo", item);

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
					SalvaModificheArticolo(tipoS, checkbox.checked);

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

window.divArticolo = function (tipoS, item) {

	let trovaId = tipoS === "ModificaArticoliSelezionabili" ? arrayId.filter(id => id == item.IdArticolo) : null;

	let div = document.createElement("div")
	div.className = "col-6 col-md-2";
	div.innerHTML = `
					<div class="card-item mb-4">
						${tipoS === "ArticoliSelezionabili" || tipoS === "ModificaArticoliSelezionabili" ? '<div class="d-flex flex-column rounded-2 p-2" style="background-color:white">' : ''}
						<div style="position: relative;">
							<img src="${item.Immagine}" class="rounded-2 " style="width: 100%; height:250px;">

							${tipoS === "MioArmadio" || tipoS === "ArticoliPreferiti" || tipoS === "FiltroArticoli" || tipoS === "FiltroTitolo" ? `
							<label class="cuore-label">
								<input type="checkbox" style="display: none;" ${item.Preferita ? "checked" : ""}>
								<span class="cuore">${item.Preferita ? "❤️" : "❤"}</span>
							</label>
							` : ''} 
						<div>


						<div class="d-flex flex-column rounded-2 p-2" style="background-color:white">
							<span class="dynamic-text fw-bold" style="font-weight: 500;">${item.Titolo}</span>
							<span class="dynamic-text" style="font-size: 12px; color#777";>${item.Colore} • ${item.Categoria}</span>
							${tipoS === "ArticoliSelezionabili" || tipoS === "ModificaArticoliSelezionabili" ? `<input type="checkbox" class="mb-2" ${tipoS === "ModificaArticoliSelezionabili" && trovaId && trovaId.length > 0 ? "checked" : ""}>` : ''}

						</div>
						${tipoS === "ArticoliSelezionabili" || tipoS === "ModificaArticoliSelezionabili" ? '</div>' : ''}					
					</div>
				`;

	return div;

	/*

							<div class="overlay">
								<span>👁 Visualizza</span>
							</div> */

}

window.DettagliArticoloModal = function (tipoS, item) {

	let disabilita = false;

	switch (tipoS) {
		case "InserisciArticolo":

			disabilita = false;

			//Mostro / Nascondo DIV
			document.getElementById("btnNuovoArticolo").style.display = "block";
			document.getElementById("divModificaArticolo").style.display = "none";
			document.getElementById("titlePopUp").textContent = "Aggiungi nuovo articolo";

			//Popola Select --> IdSelect , DefaultValue, array
			popolaSelect("Categoria", "Categoria", categoria);
			popolaSelect("Tipo", "Tipo", tipo);
			popolaSelect("Colore", "Colore", colore);
			popolaSelect("Stagione", "Stagione", stagione);			

			//Svuoto Immagine
			document.getElementById('preview').src = "";
			document.getElementById('preview').style.display = 'none';

			//Svuoto e rendo editabili i campi
			document.getElementById("Titolo").value = "";
			document.getElementById("Categoria").value = "";
			document.getElementById("Tipo").value = "";
			document.getElementById("Colore").value = "";
			document.getElementById("Stagione").value = "";

			break;
		case "VisualizzaArticolo":

			disabilita = true;

			//Mostro / Nascondo DIV
			document.getElementById("btnNuovoArticolo").style.display = "none";
			document.getElementById("divModificaArticolo").style.display = "block";
			document.getElementById("titlePopUp").textContent = "Modifica articolo";

			//Popola Select --> IdSelect , DefaultValue, array
			popolaSelect("Categoria", item.Categoria, categoria);
			popolaSelect("Tipo", item.Tipo, tipo);
			popolaSelect("Colore", item.Colore, colore);
			popolaSelect("Stagione", item.Stagione, stagione);
				
			//Mostro Immagine
			document.getElementById('preview').src = item.Immagine;
			document.getElementById('preview').style.display = 'block';

			//Mostro Dettagli
			document.getElementById("Titolo").value = item.Titolo;
			document.getElementById("btnModificaArticolo").disabled = false;
			document.getElementById("btnSalvaModificheArticolo").disabled = true;
			break;

		case "ModificaArticolo":

			disabilita = false;

			document.getElementById("btnModificaArticolo").disabled = true;
			document.getElementById("btnSalvaModificheArticolo").disabled = false;
			break;		
	}

	//Rendo editabili / non i campi
	document.getElementById("Titolo").disabled = disabilita;
	document.getElementById("Categoria").disabled = disabilita;
	document.getElementById("Tipo").disabled = disabilita;
	document.getElementById("Colore").disabled = disabilita;
	document.getElementById("Stagione").disabled = disabilita;
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
		return;
	}

	//Passa tutti gli Outfit e li mostra
	outfitArticoliTable.forEach(outfit => {

		//Div Che contiene gli Outfit
		const divGruppo = document.createElement("div");
		divGruppo.className = "row d-flex aling-items-center justify-content-center";
		divGruppo.innerHTML = `	
								<div class="col-12 d-flex flex-row justify-content-between p-2 gap-2">
									<span class="dynamic-text">Outfit N° ${i} - ${outfit.Titolo}</span>	
									<span class="dynamic-text">Data: ${outfit.DataUtilizzo}</span>	
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
		});

		lista.appendChild(divGruppo);

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
				mostraToast("Errore nella creazione del outfit", "danger");
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
					mostraToast("Errore nella creazione del Outfit_Articoli " + error1, "danger");
					return;
				}
			}

			alert("Outfit Duplicato con successo!");

			visualizzaDiv("Outfit");
			visualizzaOutfit(false);
		});

		btnModifica.addEventListener('click', async () => {

			////Mostro il nuovo Outft con flag su articoli già presenti
			idOutfit = outfit.IdOutfit;
			arrayId = outfit.IdArticolo;

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
				mostraToast("Errore nella creazione del Outfit_Articoli", "danger");
				return;
			}

			const { error } = await client
				.from('Outfit')
				.delete()
				.eq('IdOutfit', outfit.IdOutfit);

			if (error) {
				console.error(error);
				mostraToast("Errore nella creazione del Outfit", "danger");
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
		mostraToast("Errore nella creazione del outfit", "danger");
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
			mostraToast("Errore nella creazione del Outfit_Articoli", "danger");
			return;
		}
	}

	//svuota l'array
	arrayId.length = 0;

	visualizzaDiv("Outfit");

	visualizzaOutfit(true);

	mostraToast("Outfit Creato con successo!", "success");
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
window.visualizzaDiv = function (tipoS) {

	switch (tipoS) {
		case "MioArmadio":

			//Titolo
			document.getElementById("title").textContent = "Miei articoli";
			document.getElementById("sottoTitolo").textContent = "";

			//Mostro / Nascondo DIV
			document.getElementById("mieiArticoli").style.display = "block";
			document.getElementById("btnCreaOutfit").style.display = "none";
			document.getElementById("btnArticoliPreferiti").style.display = "block";
			document.getElementById("divFiltri").classList.remove("d-none");
			document.getElementById("divFiltroCerca").classList.remove("d-none");
			document.getElementById("btnAggiungiArticolo").style.display = "block";	
			document.getElementById("mieiOutfit").classList.add("d-none");
			document.getElementById("btnNuovoOutfit").style.display = "none";
			break;
		
		case "ArticoliSelezionabili":
			//Titolo
			document.getElementById("title").textContent = "Seleziona piu articoli";
			document.getElementById("sottoTitolo").textContent = "";

			//Mostro / Nascondo DIV
			document.getElementById("mieiArticoli").style.display = "block";
			document.getElementById("btnArticoliPreferiti").style.display = "none";
			document.getElementById("divFiltri").classList.add("d-none");
			document.getElementById("divFiltroCerca").classList.add("d-none");
			document.getElementById("btnCreaOutfit").style.display = "block";
			document.getElementById("btnModificaOutfit").style.display = "none";
			document.getElementById("btnCreaOutfit").style.display = "block";
			document.getElementById("btnAggiungiArticolo").style.display = "none";	
			document.getElementById("mieiOutfit").classList.add("d-none");
			document.getElementById("btnNuovoOutfit").style.display = "none";
			break;
		case "Outfit":
			//Titolo
			document.getElementById("title").textContent = "Outfit creati";
			document.getElementById("sottoTitolo").textContent = "";

			//Mostro / Nascondo DIV
			document.getElementById("mieiArticoli").style.display = "none"
			document.getElementById("mieiArticoli").innerHTML = "";
			document.getElementById("btnCreaOutfit").style.display = "none";
			document.getElementById("btnArticoliPreferiti").style.display = "none";
			document.getElementById("divFiltri").classList.add("d-none");
			document.getElementById("divFiltroCerca").classList.add("d-none");
			document.getElementById("btnAggiungiArticolo").style.display = "none";	
			document.getElementById("mieiOutfit").classList.remove("d-none");
			document.getElementById("btnNuovoOutfit").style.display = "block";
			break;
		case "ArticoliPreferiti":
			document.getElementById("btnArticoliPreferiti").style.display = "none";
			document.getElementById("divFiltri").classList.add("d-none");
			document.getElementById("divFiltroCerca").classList.add("d-none");
			break;		
		case "ModificaArticoliSelezionabili":
			//Titolo
			document.getElementById("title").textContent = "Seleziona piu articoli";
			document.getElementById("sottoTitolo").textContent = "";

			//Mostro / Nascondo DIV
			document.getElementById("mieiArticoli").style.display = "block";
			document.getElementById("btnArticoliPreferiti").style.display = "none";
			document.getElementById("divFiltri").classList.add("d-none");
			document.getElementById("divFiltroCerca").classList.add("d-none");
			document.getElementById("btnCreaOutfit").style.display = "none";
			document.getElementById("btnModificaOutfit").style.display = "block";
			document.getElementById("btnCreaOutfit").style.display = "block";
			document.getElementById("btnAggiungiArticolo").style.display = "none";
			document.getElementById("mieiOutfit").classList.add("d-none");
			document.getElementById("btnNuovoOutfit").style.display = "none";

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

	const { data, error } = await client.auth.signInWithPassword({
		email: email,
		password: password
	});

	if (error) {
		alert("Errore login");
		return;
	}

	currentUser = data.user;
	document.getElementById("spanUser").textContent = data.user.email.split("@")[0];

	document.getElementById("loginDiv").style.display = "none";
	document.getElementById("nvbar").style.display = "block";
	document.getElementById("main").style.display = "block";

	// fai partire app
	visualizzaDiv("Outfit");
	visualizzaOutfit(false);
}

window.cambiaPassword = async function () {
	const nuovaPassword = document.getElementById("newPass").value;

	if (nuovaPassword.length < 6) {
		alert("Password troppo corta");
		return;
	}

	const { data, error } = await client.auth.updateUser({
		password: nuovaPassword
	});

	if (error) {
		console.log(error.message);
		alert("Errore cambio password");
		return;
	}

	alert("Password aggiornata!");

	// opzionale: logout per sicurezza
	await client.auth.signOut();
};

window.previewImage = function (event) {
	const reader = new FileReader();
	reader.onload = function () {
		const img = document.getElementById('preview');
		img.src = reader.result;
		img.style.display = 'block';
	}
	reader.readAsDataURL(event.target.files[0]);
}

//847
