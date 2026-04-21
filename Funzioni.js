
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
		mostraToast("Seleziona una foto", "danger");
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
		mostraToast("Errore salvataggio", "danger");
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

	document.getElementById("pageOverlay").style.display = "flex";

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

		// click
		div.addEventListener('click', (e) => {
			//Blocco la continuazione del Click se premo sul cuore
			if (e.target.closest('.cuore-label')) return;
			

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
	document.getElementById("pageOverlay").style.display = "none";
}

window.divArticolo = function (tipoS, item) {

	let trovaId = tipoS === "ModificaArticoliSelezionabili" ? arrayId.filter(id => id == item.IdArticolo) : null;

	let div = document.createElement("div")

	if (tipoS === "VisualizzaOutfit") {
		div.className = "col-6 col-md-3";
	} else {
		div.className = "col-6 col-md-2";
	}

	div.innerHTML = `
					<div class="card-item mb-4">
						${tipoS === "ArticoliSelezionabili" || tipoS === "ModificaArticoliSelezionabili" ? '<div class="d-flex flex-column rounded-2 p-2" style="background-color:white">' : ''}
						<div style="position: relative;">
							<img src="${tipoS === "VisualizzaOutfit" ? item.Articoli.Immagine : item.Immagine}" class="rounded-2 " style="width: 100%; height:250px;">

							${tipoS === "MioArmadio" || tipoS === "ArticoliPreferiti" || tipoS === "FiltroArticoli" || tipoS === "FiltroTitolo" ? `
							<label class="cuore-label">
								<input type="checkbox" style="display: none;" ${( tipoS === "VisualizzaOutfit" ? item.Articoli.Preferita : item.Preferita) ? "checked" : ""}>
								<span class="cuore">${(tipoS === "VisualizzaOutfit" ? item.Articoli.Preferita : item.Preferita) ? "❤️" : "❤"}</span>
							</label>
							` : ''} 
						<div>


						<div class="d-flex flex-column rounded-2 p-2" style="background-color:white">
							<span class="dynamic-text fw-bold" style="font-weight: 500;">${tipoS === "VisualizzaOutfit" ? item.Articoli.Titolo : item.Titolo}</span>
							<span class="dynamic-text" style="font-size: 12px; color#777";>${ tipoS === "VisualizzaOutfit" ? item.Articoli.Categoria : item.Categoria} • ${tipoS === "VisualizzaOutfit" ? item.Articoli.Tipo :  item.Tipo}</span>
							${tipoS === "ArticoliSelezionabili" || tipoS === "ModificaArticoliSelezionabili"
								? `
									<input type="checkbox" class="mb-2" ${tipoS === "ModificaArticoliSelezionabili" && trovaId && trovaId.length > 0 ? "checked" : ""}> 
									<span class="count-outfit dynamic-text" style="font-size: 12px; color#777";>...</span>
								`
								: ''}

						</div>
						${tipoS === "ArticoliSelezionabili" || tipoS === "ModificaArticoliSelezionabili" ? '</div>' : ''}					
					</div>
				`;

	//Conto quanti outfit usano questo articolo
	const span = div.querySelector('.count-outfit');

	if (span) {
		contaOutfitPerArticolo(item.IdArticolo).then(count => {
			span.textContent = `Usato per ${count} Outfit`;
		});
	}

	return div;

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

//--------------------------------------------------------------------------------------- FUNZIONI OUTFIT 
window.visualizzaOutfit = async function (daBtn, tipoS) {
	let i = 0;
	const oggi = new Date().toISOString().split('T')[0];

	document.getElementById("pageOverlay").style.display = "flex";

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
		document.getElementById("pageOverlay").style.display = "none";
		return;
	}

	//Passa tutti gli Outfit e li mostra
	outfitArticoliTable.forEach(outfit => {

		//Div Che contiene gli Outfit
		const divGruppo = document.createElement("div");
		divGruppo.className = "col-md-6 col-lg-3";
		divGruppo.innerHTML = `
		  <div class="card">
			<div class="grid-img"></div>

			<div class="card-body">
				<div class="d-flex flex-column justify-content-between mt-3">
					<span class="dynamic-text fw-bold p-0" style="font-weight: 500;">Outfit N° ${i} - ${outfit.Titolo}</span>
					<span class="dynamic-text p-0" style="font-size: 12px; color#777";>Data: ${outfit.DataUtilizzo}</span>
					<span class="dynamic-text p-0" style="font-size: 12px; color#777";>	${outfit.Outfit_Articoli.map(a => a.Articoli.Tipo).join(" • ")}</span>
				</div>

				<div class="d-flex flex-row justify-content-between mt-3 gap-2">
					<button id="btnDuplicaOutfit" class="btn dynamic-btn" style="background-color: #5f8f73cc;">📚 Duplica</button>
					<button id="btnModificaOutfit" class="btn dynamic-btn" style="background-color: #6c757dcc;">✏️ Modifica</button>
					<button id="btnEliminaOutfit" class="btn dynamic-btn" style="background-color: #dc3545cc;">🗑️ Elimina</button>
				</div>
			</div>

		  </div>
		`;

		const grid = divGruppo.querySelector(".grid-img");

		const articoli = outfit.Outfit_Articoli;

		// massimo 4 celle (3 immagini + contatore)
		articoli.slice(0, 3).forEach(a => {
			const img = document.createElement("img");
			img.src = a.Articoli.Immagine;
			grid.appendChild(img);
		});

		// se ci sono più immagini
		if (articoli.length > 3) {
			const more = document.createElement("div");
			more.className = "more-box";
			more.textContent = "+" + (articoli.length - 3);
			grid.appendChild(more);
		}

		if (tipoS === "FiltroArticoli" || tipoS === "FiltroTitolo") {

			//Visualizzo solo gli outfit che soddisfano il filtro
			outfitArticoliTable.forEach(outfit => {

				const articoli = outfit.Outfit_Articoli;

				let visualizzaOutfit = false;

				// Controlla se almeno un articolo soddisfa i filtri
				for (let a of articoli) {

					if (tipoS === "FiltroArticoli") {
						if (
							(categoriaValue == "" || a.Articoli.Categoria === categoriaValue) &&
							(tipoValue == "" || a.Articoli.Tipo === tipoValue) &&
							(coloreValue == "" || a.Articoli.Colore === coloreValue) &&
							(stagioneValue == "" || a.Articoli.Stagione === stagioneValue)
						) {
							visualizzaOutfit = true;
							break;	//Basta un articolo valido
						}

					} else if (tipoS === "FiltroTitolo") {

						//Mostro solo quelli che contengono il VALUE nel Titolo
						let filetTitle = document.getElementById("filterTitle").value;

						if (filetTitle === "") {
							visualizzaOutfit = true;
							break;	//Basta un articolo valido
						} else if (a.Articoli.Titolo.includes(filetTitle)) {
							visualizzaOutfit = true;
							break;	//Basta un articolo valido
						}

					}
				}

				if (visualizzaOutfit) {
					lista.appendChild(divGruppo);
				}
			});
		} else {
			lista.appendChild(divGruppo);
		}


		//Gestisco i click dei BTN
		const btnDuplica = divGruppo.querySelector('#btnDuplicaOutfit');
		const btnModifica = divGruppo.querySelector('#btnModificaOutfit');
		const btnElimina = divGruppo.querySelector('#btnEliminaOutfit');

		// Doppio click
		divGruppo.addEventListener('click', (e) => {
			//Blocco la continuazione del Click se premo sul cuore
			if (e.target.closest('button')) return;

			let outfitSelezionato = outfitArticoliTable.find(item => item.IdOutfit == outfit.IdOutfit);

			//apro il modal
			const modal = new bootstrap.Modal(document.getElementById('dettagliOutfitModal'));
			modal.show();
					
			DettagliOutfitModal("VisualizzaOutfit", outfitSelezionato);

		});

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

			mostraToast("Outfit Duplicato con successo!", "success");

			visualizzaDiv("Outfit");
			visualizzaOutfit(daBtn);
		});

		btnModifica.addEventListener('click', async () => {

			////Mostro il nuovo Outft con flag su articoli già presenti
			idOutfit = outfit.IdOutfit;
			arrayId = outfit.Outfit_Articoli.map(a => a.Articoli.IdArticolo);

			visualizzaDiv("ModificaArticoliSelezionabili");

			visualizzaArticoli("mieiArticoli", "Articoli", "ModificaArticoliSelezionabili");
		});

		btnElimina.addEventListener('click', async () => {

			if (!confirm("Sicuro di voler eliminare l'outfit??")) { return;}

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

			mostraToast("Outfit Eliminato con successo!", "success");

			visualizzaDiv("Outfit");
			visualizzaOutfit(daBtn);
		});

		i++;
	});

	document.getElementById("pageOverlay").style.display = "none";
}

window.DettagliOutfitModal = async function (tipoS, outfit) {

	//Popola Elenco Articoli
	const grid = document.getElementById("elencoArticoliOutfit");
	grid.innerHTML = "";

	document.getElementById("titleOutfitPopUp").textContent = outfit.Titolo;
	document.getElementById("dateOutfitPopUp").textContent = outfit.DataUtilizzo;

	outfit.Outfit_Articoli.forEach(item => {

		let div = divArticolo(tipoS, item);
		grid.appendChild(div);
	});
}

window.creaOutfit = async function (arrayId) {

	if (arrayId.length < 2) {
		mostraToast("Attenzione! Seleziona Più di 2 articoli", "danger");
		return;
	}

	document.getElementById("pageOverlay").style.display = "flex";

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

	document.getElementById("pageOverlay").style.display = "none";
}

window.salvaModificheOutfit = async function (arrayId) {

	if (arrayId.length < 2) {
		mostraToast("Attenzione! Seleziona Più di 2 articoli", "danger");
		return;
	}

	document.getElementById("pageOverlay").style.display = "flex";

	//Cancelli i vecchi collegamenti
	const { error: error1 } = await client
		.from('Outfit_Articoli')
		.delete()
		.eq('IdOutfit', idOutfit);

	if (error1) {
		console.error(error1);
		mostraToast("Errore nella creazione del Outfit_Articoli", "danger");
		return;
	}

	const righe = arrayId.map(id => ({
		IdOutfit: idOutfit,
		IdArticolo: id
	}));

	const { error } = await client
		.from('Outfit_Articoli')
		.insert(righe);

	if (error) {
		console.error(error);
	}

	mostraToast("Outfit Modificato con successo!", "success");

	visualizzaDiv("Outfit");
	visualizzaOutfit(true);

	document.getElementById("pageOverlay").style.display = "none";
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

window.contaOutfitPerArticolo = async function (idArticolo) {


	document.getElementById("pageOverlay").style.display = "flex";

	const { data: outfitArticoliTable, error } = await client
		.from('Outfit')
		.select(`
		*,
		Outfit_Articoli(
			Articoli(*)
		)
	`);
		
	if (error) {
		console.error(error);
		mostraToast("Errore nella creazione del outfit", "danger");
		return;
	}

	//Conto quanti outfit usano questo articolo
	let conta = 0;

	outfitArticoliTable.forEach(outfit => {

		const articoli = outfit.Outfit_Articoli;

		// Controlla se almeno un articolo soddisfa i filtri
		for (let a of articoli) {
			if (a.Articoli.IdArticolo === idArticolo) {
				conta++;
			}
		}
	});

	document.getElementById("pageOverlay").style.display = "none";

	return conta;
}
//--------------------------------------------------------------------------------------- FUNZIONI VARIE
window.visualizzaDiv = function (tipoS) {

	switch (tipoS) {
		case "MioArmadio":

			//Titolo
			document.getElementById("title").textContent = "Miei articoli";
			document.getElementById("sottoTitolo").textContent = "";

			//Mostro / Nascondo DIV
			document.getElementById("mieiArticoli").classList.remove("d-none");
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
			document.getElementById("mieiArticoli").classList.remove("d-none");
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
		case "OutfitDiOggi":
			//Titolo
			document.getElementById("title").textContent = tipoS === "Outfit" ? "Outfit creati" : "Outfit di Oggi";
			document.getElementById("sottoTitolo").textContent = "";

			//Mostro / Nascondo DIV
			document.getElementById("mieiArticoli").classList.add("d-none");
			document.getElementById("mieiArticoli").innerHTML = "";
			document.getElementById("btnCreaOutfit").style.display = "none";
			document.getElementById("btnArticoliPreferiti").style.display = "none";
			document.getElementById("divFiltri").classList.remove("d-none");
			document.getElementById("divFiltroCerca").classList.remove("d-none");
			document.getElementById("btnAggiungiArticolo").style.display = "none";	
			document.getElementById("mieiOutfit").classList.remove("d-none");			
			document.getElementById("btnNuovoOutfit").style.display = "block";
			document.getElementById("btnModificaOutfit").style.display = "none";
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
			document.getElementById("mieiArticoli").classList.remove("d-none");
			document.getElementById("btnArticoliPreferiti").style.display = "none";
			document.getElementById("divFiltri").classList.add("d-none");
			document.getElementById("divFiltroCerca").classList.add("d-none");
			document.getElementById("btnCreaOutfit").style.display = "none";
			document.getElementById("btnModificaOutfit").style.display = "block";
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

//Connesione al DB
const { createClient } = supabase;

window.client = createClient(
	'https://scutvzratunegnqrnmkc.supabase.co',
	'sb_publishable_4swbXQMuEvUMfnXEvNUaTw_58HTnde1',
	{
		auth: {
			persistSession: true,
			autoRefreshToken: true,
			detectSessionInUrl: false,
		}
	}
);

window.login = async function () {

	document.getElementById("pageOverlay").style.display = "flex";

	const email = document.getElementById("email").value;
	const password = document.getElementById("password").value;

	const { data, error } = await client.auth.signInWithPassword({
		email: email,
		password: password
	});

	if (error) {
		mostraToast("Errore login", "danger");
		return;
	}

	// 🔥 IMPORTANTISSIMO: lascia tempo al browser di scrivere sessione
	await new Promise(resolve => setTimeout(resolve, 150));

	document.getElementById("pageOverlay").style.display = "none";

	window.location.href = "/Armadio.html";	
}

window.cambiaPassword = async function () {
	const nuovaPassword = document.getElementById("newPass").value;

	if (nuovaPassword.length < 6) {
		mostraToast("Password troppo corta", "danger");
		return;
	}

	const { data, error } = await client.auth.updateUser({
		password: nuovaPassword
	});

	if (error) {
		console.log(error.message);
		mostraToast("Errore cambio password", "danger");
		return;
	}

	mostraToast("Password aggiornata!", "success");

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

window.popolaTuttiSelect = function () {

	//Popola Select --> IdSelect , DefaultValue, array
	popolaSelect("CategoriaFiltro", "Categoria", categoria);
	popolaSelect("TipoFiltro", "Tipo", tipo);
	popolaSelect("ColoreFiltro", "Colore", colore);
	popolaSelect("StagioneFiltro", "Stagione", stagione);
}

//1004
