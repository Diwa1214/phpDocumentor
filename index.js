let lastFolderQuery = '';
          let lastContentQuery = '';
        function getFileContent(filePath, searchQuery) {
            fetch(`http://127.0.0.1:3001/getFileContent?filePath=${encodeURIComponent(filePath)}`)
                .then(response => response.text())
                .then(content => {
                    const fileContentElement = document.getElementById('fileContent');
                    const highlightedContent = highlightContentOccurrences(content, searchQuery);
                    fileContentElement.innerHTML = `<code><pre>${highlightedContent}</pre></code>`;
                })
                .catch(error => console.log(error));
        }

        function createFileLink(filePath, searchQuery) {
            const listItem = document.createElement('li');
            listItem.className = "fileListOrder"
            const link = document.createElement('a');
            const startIndex = filePath.indexOf('mso');
            const simplifiedPath = filePath.slice(startIndex);
            link.textContent = simplifiedPath;
            link.href = '#';
            link.onclick = () => displayFileContent(filePath, searchQuery); // Updated click event handler
            listItem.appendChild(link);
            return listItem;
        }

        function displayFileContent(filePath, searchQuery) {
            getFileContent(filePath, searchQuery);
        }

        function highlightContentOccurrences(content, searchQuery) {
            const regex = new RegExp(searchQuery, 'gi');
            return content.replace(regex, '<span class="highlight">$&</span>');
        }

        function highlightFileNames(query, fileNames) {
            const fileList = document.getElementById('fileList');
            fileList.innerHTML = ''; // Clear previous list

            fileNames.forEach(filePath => {
                const link = createFileLink(filePath, query);
                const fileName = link.textContent.toLowerCase();
                const searchQuery = query.toLowerCase();
                const startIndex = fileName.indexOf(searchQuery);
                if (startIndex !== -1) {
                    const before = link.textContent.slice(0, startIndex);
                    const match = link.textContent.slice(startIndex, startIndex + searchQuery.length);
                    const after = link.textContent.slice(startIndex + searchQuery.length);
                    link.innerHTML = `${before}<span class="highlight">${match}</span>${after}`;
                } else {
                    link.innerHTML = link.textContent; // Reset to original text if no match
                }
                fileList.appendChild(link);
            });
        }

        function filterFilenamesByContent(searchQuery) {
            fetch(`http://127.0.0.1:3001/searchFilenames?query=${encodeURIComponent(searchQuery)}`)
                .then(response => response.json())
                .then(filteredFileNames => {
                    highlightFileNames(searchQuery, filteredFileNames); // Highlight filenames based on the search query

                    const fileList = document.getElementById('fileList');
                    fileList.innerHTML = ''; // Clear previous list

                    filteredFileNames.forEach(filePath => {
                        const link = createFileLink(filePath, searchQuery);
                        fileList.appendChild(link);
                    });

                    if (filteredFileNames.length > 0) {
                        displayFileContent(filteredFileNames[0], searchQuery);
                    } else {
                        document.getElementById('fileContent').textContent = 'No matching files found.';
                    }
                })
                .catch(error => console.log(error));
        }

        const folderSearchInput = document.getElementById('folderSearchInput');
        folderSearchInput.addEventListener('input', () => {
            const query = folderSearchInput.value;
            performContentSearch(query);
            lastFolderQuery = query; // Save the last folder search query
        });

        const contentSearchInput = document.getElementById('contentSearchInput');
        contentSearchInput.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                const query = contentSearchInput.value;
                filterFilenamesByContent(query); // Filter filenames first, then highlight content
                lastContentQuery = query; // Save the last content search query
            }
        });

        function performContentSearch(query) {
            fetch(`http://127.0.0.1:3001/searchFilenames?query=${encodeURIComponent(query)}`)
                .then(response => response.json())
                .then(fileNames => {
                    highlightFileNames(query, fileNames); // Highlight filenames based on the search query

                    const fileList = document.getElementById('fileList');
                    fileList.innerHTML = ''; // Clear previous list

                    fileNames.forEach(filePath => {
                        const link = createFileLink(filePath, query);
                        fileList.appendChild(link);
                    });

                    if (fileNames.length > 0) {
                        displayFileContent(fileNames[0], query);
                    } else {
                        document.getElementById('fileContent').textContent = 'No matching files found.';
                    }
                })
                .catch(error => console.log(error));
        }

        fetch('http://127.0.0.1:3001/getProjectData')
        .then(response => response.json())
        .then(data => {
            const fileList = document.getElementById('fileList');
            data.forEach(filePath => {
                const listItem = createFileLink(filePath, '');
                listItem.classList.add('folder'); // Add a class to identify folders
                fileList.appendChild(listItem);
            });

            // Repopulate search boxes with last queries
            folderSearchInput.value = lastFolderQuery;
            contentSearchInput.value = lastContentQuery;
            // Perform content search for last content query
            performContentSearch(lastContentQuery);
        })
        .catch(error => console.log(error));