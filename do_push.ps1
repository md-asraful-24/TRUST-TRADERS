$env:PATH += ";C:\Users\Admin\mingit\cmd;C:\Users\Admin\gh\bin"
& 'C:\Users\Admin\mingit\cmd\git.exe' add .
& 'C:\Users\Admin\mingit\cmd\git.exe' commit -m "Update account ledger table layout: move previous balance to first row"
$token = (& 'C:\Users\Admin\gh\bin\gh.exe' auth token).Trim()
& 'C:\Users\Admin\mingit\cmd\git.exe' push "https://${token}@github.com/md-asraful-24/TRUST-TRADERS.git" main --force
