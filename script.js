const path = window.location.pathname;
if (path.includes('index.html') || path === '/') {
    handleListsPage();
} else if (path.includes('lista.html')) {
    handleItemsPage();
}

//Function de Listas
function handleListsPage() {
    const listsContainer = document.getElementById('shopping-lists');
    const dialog = document.getElementById('list-dialog');
    const dialogTitle = document.getElementById('dialog-title');
    const listNameInput = document.getElementById('list-name-input');
    const addListBtn = document.getElementById('add-list-btn');
    const cancelListBtn = document.getElementById('cancel-list-btn');
    let currentEditingListId = null;

    const getLists = () => JSON.parse(localStorage.getItem('shoppingLists')) || [];
    const saveLists = (lists) => localStorage.setItem('shoppingLists', JSON.stringify(lists));

    /*cria integração do botão de limpar lista*/
    const clearBtn = document.getElementById('clear-btn');

    clearBtn.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja limpar todas as listas?')) {
            localStorage.removeItem('shoppingLists');
            renderLists();
        }
    });

    const renderLists = () => {
        const lists = getLists();
        listsContainer.innerHTML = ''; 

        if (lists.length === 0) {
            const emptyItem = document.createElement('md-list-item');
            emptyItem.headline = 'Nenhuma lista encontrada. Crie uma!';
            listsContainer.appendChild(emptyItem);
            return;
        }

        lists.forEach(list => {
            const listItem = document.createElement('md-list-item');
            listItem.dataset.id = list.id;
            
            const headline = document.createElement('div');
            headline.slot = 'headline';
            headline.className = list.completed ? 'completed' : '';
            headline.textContent = list.name;
            
            const actions = document.createElement('div');
            actions.slot = 'end';
            actions.className = 'item-actions';

            const statusBtn = document.createElement('md-icon-button');
            const statusIcon = document.createElement('md-icon');
            statusIcon.textContent = 'check_circle';
            statusIcon.style.color = list.completed ? '#4caf50' : '#bdbdbd';
            statusBtn.appendChild(statusIcon);
            statusBtn.addEventListener('click', () => toggleListCompleted(list.id, !list.completed));

            const editBtn = createIconButton('edit', () => openEditDialog(list));
            const deleteBtn = createIconButton('delete', () => deleteList(list.id));
            
            actions.append(statusBtn, editBtn, deleteBtn);
            listItem.append(headline, actions);
            
            headline.style.cursor = 'pointer';
            headline.addEventListener('click', () => {
                window.location.href = `lista.html?id=${list.id}`;
            });

            listsContainer.appendChild(listItem);
        });
    };
    
    const createIconButton = (iconName, onClick) => {
        const btn = document.createElement('md-icon-button');
        const icon = document.createElement('md-icon');
        icon.textContent = iconName;
        btn.appendChild(icon);
        btn.addEventListener('click', onClick);
        return btn;
    };
    
    const openEditDialog = (list) => {
        currentEditingListId = list.id;
        dialogTitle.textContent = 'Editar Lista';
        listNameInput.value = list.name;
        dialog.show();
    };

    const deleteList = (listId) => {
        if (confirm('Tem certeza que deseja excluir esta lista?')) {
            let lists = getLists();
            lists = lists.filter(l => l.id !== listId);
            saveLists(lists);
            renderLists();
        }
    };

    const toggleListCompleted = (listId, isCompleted) => {
        const lists = getLists();
        const list = lists.find(l => l.id === listId);
        list.completed = isCompleted;
        saveLists(lists);
        renderLists();
    };

    addListBtn.addEventListener('click', () => {
        currentEditingListId = null;
        dialogTitle.textContent = 'Nova Lista';
        listNameInput.value = '';
        dialog.show();
    });

    //incluído para fechar o diálogo quando cancelar
    cancelListBtn.addEventListener('click', () => {
        dialog.close();
    });

    dialog.addEventListener('close', (e) => {
       
        const listName = listNameInput.value.trim();
        if (listName === '') return;

        const lists = getLists();
        if (currentEditingListId) {
            const listToUpdate = lists.find(l => l.id === currentEditingListId);
            listToUpdate.name = listName;
        } else {
            lists.push({ id: Date.now().toString(), name: listName, completed: false, items: [] });
        }

        saveLists(lists);
        renderLists();
    });

    renderLists();
}

//Function de Itens
function handleItemsPage() {
    const listNameHeader = document.getElementById('list-name-header');
    const itemsContainer = document.getElementById('list-items');
    const dialog = document.getElementById('item-dialog');
    const dialogTitle = document.getElementById('item-dialog-title');
    const itemNameInput = document.getElementById('item-name-input');
    const itemPriceInput = document.getElementById('item-price-input'); /*criando o input de valor na caixa de dialogo dos itens*/
    const addItemBtn = document.getElementById('add-item-btn');
    const cancelItemBtn = document.getElementById('cancel-item-btn');

    const urlParams = new URLSearchParams(window.location.search);
    const listId = urlParams.get('id');
    if (!listId) { window.location.href = 'index.html'; return; }

    const getLists = () => JSON.parse(localStorage.getItem('shoppingLists')) || [];
    const saveLists = (lists) => localStorage.setItem('shoppingLists', JSON.stringify(lists));
    
    let allLists = getLists();
    let currentList = allLists.find(l => l.id === listId);
    let currentEditingItemId = null;

    if (!currentList) { alert('Lista não encontrada!'); window.location.href = 'index.html'; return; }

    listNameHeader.textContent = currentList.name;

    const clearListBtn = document.getElementById('clear-list-btn'); /*criando botão para limpeza de itens*/

    clearListBtn.addEventListener('click', () => {
        if(confirm('Tem certeza que deseja limpar todos os itens desta lista?')) {
            currentList.items = [];
            const totalDiv = document.getElementById('total-footer');
            if (totalDiv) totalDiv.remove(); // Remove o campo do total toda vez que limpar a lista
            saveCurrentList();
            renderItems();
        }
    });

    const renderItems = () => {
        itemsContainer.innerHTML = '';
        if (currentList.items.length === 0) {
            const emptyItem = document.createElement('md-list-item');
            emptyItem.headline = 'Nenhum item adicionado.';
            itemsContainer.appendChild(emptyItem);
            return;
        }

        currentList.items.forEach(item => {
            const listItem = document.createElement('md-list-item');
            listItem.dataset.id = item.id;
                        
            const headline = document.createElement('div');
            headline.slot = 'headline';
            headline.className = item.completed ? 'completed' : '';
            headline.textContent = item.name;

            /*criando a div do preço e recebendo o valor de item-price*/
            const priceDiv = document.createElement('div');
            priceDiv.textContent = `R$ ${item.price?.toFixed(2) || '0.00'}`;
            priceDiv.className = 'item-price';
            headline.appendChild(priceDiv);
            
            const actions = document.createElement('div');
            actions.slot = 'end';
            actions.className = 'item-actions';

            const statusBtn = document.createElement('md-icon-button');
            const statusIcon = document.createElement('md-icon');
            statusIcon.textContent = 'check_circle';
            statusIcon.style.color = item.completed ? '#4caf50' : '#bdbdbd';
            statusBtn.appendChild(statusIcon);
            statusBtn.addEventListener('click', () => {
                item.completed = !item.completed;
                saveCurrentList();
                renderItems();
            });

            const editBtn = createIconButton('edit', () => {
                currentEditingItemId = item.id;
                dialogTitle.textContent = 'Editar Item';
                itemNameInput.value = item.name;
                dialog.show();
            });
            const deleteBtn = createIconButton('delete', () => {
                if (confirm('Excluir este item?')) {
                    currentList.items = currentList.items.filter(i => i.id !== item.id);
                    saveCurrentList();
                    renderItems();
                }
            });
            
            actions.append(statusBtn, editBtn, deleteBtn);
            listItem.append(headline, actions);
            itemsContainer.appendChild(listItem);
        });

        /*aqui listamos o total das somas fora do for each de cada item - total externo*/
        const total = currentList.items.reduce((sum, item) => sum + (item.price || 0), 0);
        let totalDiv = document.getElementById('total-footer');
        if (!totalDiv) {
            totalDiv = document.createElement('div');
            totalDiv.id = 'total-footer';
            itemsContainer.parentElement.appendChild(totalDiv);
        }
        /*aqui monta a div do total externa com o retorno da TotalDiv acima*/
        totalDiv.textContent = `Total: R$ ${total.toFixed(2)}`;
    };

    const saveCurrentList = () => {
        const listIndex = allLists.findIndex(l => l.id === listId);
        allLists[listIndex] = currentList;
        saveLists(allLists);
    };

    const createIconButton = (iconName, onClick) => {
        const btn = document.createElement('md-icon-button');
        const icon = document.createElement('md-icon');
        icon.textContent = iconName;
        btn.appendChild(icon);
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            onClick();
        });
        return btn;
    };

    addItemBtn.addEventListener('click', () => {
        currentEditingItemId = null;
        dialogTitle.textContent = 'Novo Item';
        itemNameInput.value = '';
        dialog.show();
    });

    //incluído para fechar o diálogo quando cancelar
    cancelItemBtn.addEventListener('click', () => {
        dialog.close();
    });

    dialog.addEventListener('close', (e) => {
        
        const itemName = itemNameInput.value.trim();
        if (itemName === '') return;    

        /*criando a constante para guardar o valor - na caixa de dialogo dos itens*/
        const price = parseFloat(itemPriceInput.value) || 0;

        if (currentEditingItemId) {
            const itemToUpdate = currentList.items.find(i => i.id === currentEditingItemId);
            itemToUpdate.name = itemName;
            itemToUpdate.price = price; /*incluido o campo PRICE aqui para gravar quando editar*/
        } else {
            currentList.items.push({ id: Date.now().toString(), name: itemName, price: price, completed: false }); /*incluido o campo PRICE aqui para gravar quando criar novo*/
        }
        
        saveCurrentList();
        renderItems();
    });

    renderItems();

}