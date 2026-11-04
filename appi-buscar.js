/* APPI v905 · Buscador de Appi.
   Busca en todo lo que ya está en el teléfono: usuarios (con sus purificadores
   y números de serie), distribuidores del equipo, contactos del Panel y
   pantallas de la app. No consulta internet: todo sale del aparato. */
(function(){
  'use strict';

  const MAX_POR_SECCION=4;

  function norm(v){
    return String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  }
  function alnum(v){
    return String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .toLowerCase().replace(/[^a-z0-9]+/g,'');
  }
  function texto(v){return String(v==null?'':v).trim()}
  function formatoPrecio(n){
    try{return new Intl.NumberFormat('es-AR',{maximumFractionDigits:0}).format(Number(n)||0)}catch(e){return String(Math.round(Number(n)||0))}
  }

  /* ---------- de dónde salen los datos ---------- */
  function listaUsuarios(){
    // Lo que la app ya agrupó al abrir Usuarios…
    try{const l=window.usuariosU;if(Array.isArray(l)&&l.length)return l}catch(e){}
    // …o, si todavía no se abrió esa pantalla, la planilla guardada.
    return usuariosDeMemoria();
  }
  let storageCrudo=null,storageLista=[];
  function usuariosDeMemoria(){
    let crudo='';
    try{crudo=localStorage.getItem('usuarios_garantias')||''}catch(e){return[]}
    if(crudo===storageCrudo)return storageLista;
    storageCrudo=crudo;storageLista=[];
    if(!crudo)return storageLista;
    let filas=null;
    try{filas=JSON.parse(crudo)}catch(e){return storageLista}
    if(!Array.isArray(filas)||!filas.length)return storageLista;
    // Si ya vienen agrupados (una persona con sus productos) se usan tal cual.
    const agrupados=filas.every(function(x){return x&&Array.isArray(x.productos)&&x.productos.length});
    if(agrupados){storageLista=filas;return storageLista}
    const mapa={};
    filas.forEach(function(p){
      if(!p)return;
      const clave=norm(p.usuario||'')||('fila'+Object.keys(mapa).length);
      if(!mapa[clave])mapa[clave]={usuario:texto(p.usuario),productos:[]};
      const m=mapa[clave];
      ['telf','domicilio','localidad','email','cp','dipReasignado'].forEach(function(k){
        if(!texto(m[k])&&texto(p[k]))m[k]=texto(p[k]);
      });
      m.productos.push(p);
    });
    storageLista=Object.keys(mapa).map(function(k){
      const m=mapa[k];
      const ultimo=m.productos[m.productos.length-1]||{};
      m.producto=texto(ultimo.producto);m.serie=texto(ultimo.serie);m.fVenceRaw=texto(ultimo.fVenceRaw);
      return m;
    });
    return storageLista;
  }
  function listaEquipo(){
    try{
      // `equipoData` vive en el script principal de la app.
      const d=(typeof equipoData!=='undefined')?equipoData:window.equipoData;
      if(d&&Array.isArray(d.personas))return d.personas;
    }catch(e){}
    return [];
  }
  function listaContactos(){
    try{
      const s=window.APPIGestion&&window.APPIGestion.state;
      return s&&Array.isArray(s.contacts)?s.contacts:[];
    }catch(e){return[]}
  }

  /* ---------- preparación (se guarda mientras no cambie la lista) ---------- */
  let cacheRef=null,cacheLargo=-1,cacheLista=[];
  function usuariosPreparados(){
    const lista=listaUsuarios();
    if(lista===cacheRef&&lista.length===cacheLargo)return cacheLista;
    cacheRef=lista;cacheLargo=lista.length;
    cacheLista=lista.map(function(u){
      const productos=Array.isArray(u&&u.productos)?u.productos:[];
      const series=productos.map(function(p){
        return {
          serie:texto(p&&p.serie),
          producto:texto(p&&p.producto)||'Purificador',
          vence:texto(p&&(p.fVenceRaw||p.fVence))
        };
      }).filter(function(p){return !!p.serie});
      if(!series.length&&texto(u&&u.serie)){
        series.push({serie:texto(u.serie),producto:texto(u.producto)||'Purificador',vence:texto(u.fVenceRaw)});
      }
      // Para «Usuarios» cuentan los datos de la persona (nombre, teléfono,
      // dirección, DIP). Los productos y las series tienen su propia sección.
      const bolsa=[
        u&&u.usuario,u&&u.tipoDoc,u&&u.telf,u&&u.domicilio,u&&u.localidad,u&&u.cp,
        u&&u.email,u&&u.dipReasignado
      ].join(' ');
      return {u:u,series:series,hay:norm(bolsa),aln:alnum(bolsa),nombre:norm(u&&u.usuario)};
    });
    return cacheLista;
  }

  let cacheEqRef=null,cacheEqLargo=-1,cacheEq=[];
  function equipoPreparado(){
    const lista=listaEquipo();
    if(lista===cacheEqRef&&lista.length===cacheEqLargo)return cacheEq;
    cacheEqRef=lista;cacheEqLargo=lista.length;
    cacheEq=lista.map(function(p){
      const bolsa=[p&&p.nombre,p&&p.codigo,p&&p.cat,p&&p.tel,p&&p.email,p&&p.estado].join(' ');
      return {p:p,hay:norm(bolsa),aln:alnum(bolsa),nombre:norm(p&&p.nombre)};
    });
    return cacheEq;
  }

  /* ---------- comparación y orden ---------- */
  function puntaje(item,q,qAln){
    const tokens=q.split(' ').filter(Boolean);
    let ok=true;
    for(let i=0;i<tokens.length;i++){
      const t=tokens[i];
      if(item.hay.indexOf(t)<0&&item.aln.indexOf(alnum(t))<0){ok=false;break}
    }
    if(!ok)return 0;
    let s=30;
    if(item.nombre&&item.nombre===q)s+=120;
    else if(item.nombre&&item.nombre.indexOf(q)===0)s+=80;
    else if(item.nombre&&(' '+item.nombre).indexOf(' '+tokens[0])>=0)s+=45;
    if(qAln&&item.aln.indexOf(qAln)>=0)s+=20;
    return s;
  }
  function ordenar(items,q,qAln){
    return items.map(function(it){return {it:it,score:puntaje(it,q,qAln)}})
      .filter(function(x){return x.score>0})
      .sort(function(a,b){return b.score-a.score})
      .map(function(x){return x.it});
  }

  /* ---------- búsqueda ---------- */
  function buscar(consulta,opciones){
    opciones=opciones||{};
    const original=texto(consulta);
    const q=norm(original), qAln=alnum(original);
    const salida={consulta:original,secciones:[],total:0};
    if(q.length<2)return salida;

    // 1. Usuarios
    const usuarios=ordenar(usuariosPreparados(),q,qAln);
    if(usuarios.length){
      salida.secciones.push({
        id:'usuarios',titulo:'Usuarios',icono:'users',tono:'c2',total:usuarios.length,
        items:usuarios.slice(0,MAX_POR_SECCION).map(function(x){
          const u=x.u||{};
          const partes=[texto(u.localidad),texto(u.telf),texto(u.producto)].filter(Boolean);
          return {tipo:'usuario',titulo:texto(u.usuario)||'Usuario sin nombre',sub:partes.join(' · '),valor:texto(u.usuario)};
        }),
        verTodos:{texto:'Ver los '+usuarios.length+' usuarios',valor:original,accion:'usuarios'}
      });
    }

    // 2. Distribuidores del equipo
    const equipo=ordenar(equipoPreparado(),q,qAln);
    if(equipo.length){
      salida.secciones.push({
        id:'distribuidores',titulo:'Distribuidores',icono:'team',tono:'c1',total:equipo.length,
        items:equipo.slice(0,MAX_POR_SECCION).map(function(x){
          const p=x.p||{};
          const partes=[texto(p.codigo)?('DIP '+texto(p.codigo)):'',texto(p.cat),texto(p.tel)].filter(Boolean);
          return {tipo:'distribuidor',titulo:texto(p.nombre)||'Sin nombre',sub:partes.join(' · '),valor:texto(p.codigo)||texto(p.nombre)};
        }),
        verTodos:{texto:'Ver los '+equipo.length+' distribuidores',valor:original,accion:'equipo'}
      });
    }

    // 3. Purificadores por número de serie
    const series=[];
    usuariosPreparados().forEach(function(x){
      x.series.forEach(function(s){
        const hay=norm(s.serie+' '+s.producto+' '+(x.u&&x.u.usuario||'')+' '+(x.u&&x.u.localidad||''));
        const alnSerie=alnum(s.serie);
        let score=0;
        if(alnSerie.indexOf(qAln)>=0&&qAln)score=100;
        else{
          const tokens=q.split(' ').filter(Boolean);
          let ok=true;
          for(let i=0;i<tokens.length;i++){
            if(hay.indexOf(tokens[i])<0&&alnSerie.indexOf(alnum(tokens[i]))<0){ok=false;break}
          }
          if(ok)score=25;
        }
        if(score>0)series.push({score:score,s:s,u:x.u});
      });
    });
    series.sort(function(a,b){return b.score-a.score});
    if(series.length){
      salida.secciones.push({
        id:'purificadores',titulo:'Purificadores',icono:'tag',tono:'c3',total:series.length,
        items:series.slice(0,MAX_POR_SECCION).map(function(x){
          const partes=[texto(x.u&&x.u.usuario),texto(x.s.producto),x.s.vence?('vence '+x.s.vence):''].filter(Boolean);
          return {tipo:'serie',titulo:'Serie '+x.s.serie,sub:partes.join(' · '),valor:x.s.serie};
        }),
        verTodos:{texto:'Ver los '+series.length+' equipos',valor:original,accion:'usuarios'}
      });
    }

    // 4. Contactos del Panel
    const contactos=listaContactos().map(function(c){
      const bolsa=[c&&c.nombre,c&&c.telefono,c&&c.telefono_normalizado,c&&c.notas,c&&c.referido_por,c&&c.zona].join(' ');
      return {c:c,hay:norm(bolsa),aln:alnum(bolsa),nombre:norm(c&&c.nombre)};
    });
    const gente=ordenar(contactos,q,qAln);
    if(gente.length){
      salida.secciones.push({
        id:'contactos',titulo:'Contactos',icono:'star',tono:'c4',total:gente.length,
        items:gente.slice(0,MAX_POR_SECCION).map(function(x){
          const c=x.c||{};
          return {tipo:'contacto',titulo:texto(c.nombre)||'Contacto',sub:[texto(c.telefono),texto(c.estado)].filter(Boolean).join(' · '),id:c.id};
        }),
        verTodos:{texto:'Ver los '+gente.length+' contactos',valor:original,accion:'contactos'}
      });
    }

    // 5. Productos de la Lista de precios (nombre, SKU o grupo)
    const catalogo=(function(){
      try{
        if(!window.APPILista)return [];
        const l=window.APPILista.productos();
        if(!l.length)window.APPILista.pedir();
        return l;
      }catch(e){return[]}
    })();
    const productos=[];
    catalogo.forEach(function(p){
      const hay=norm(p.nombre+' '+p.sku+' '+p.grupo);
      const tokens=q.split(' ').filter(Boolean);
      let ok=true;
      for(let i=0;i<tokens.length;i++){
        if(hay.indexOf(tokens[i])<0&&alnum(p.sku+' '+p.nombre).indexOf(alnum(tokens[i]))<0){ok=false;break}
      }
      if(!ok)return;
      let score=20;
      if(alnum(p.sku)&&alnum(p.sku)===qAln)score=120;
      else if(norm(p.nombre).indexOf(q)===0)score=80;
      else if(alnum(p.sku).indexOf(qAln)===0&&qAln)score=70;
      productos.push({score:score,p:p});
    });
    productos.sort(function(a,b){return b.score-a.score});
    if(productos.length){
      salida.secciones.push({
        id:'productos',titulo:'Productos',icono:'box',tono:'c1',total:productos.length,
        items:productos.slice(0,MAX_POR_SECCION).map(function(x){
          const p=x.p;
          const partes=[p.sku?('SKU '+p.sku):'',p.grupo?p.grupo:'',p.precio?('$ '+formatoPrecio(p.precio)):''].filter(Boolean);
          return {tipo:'producto',titulo:p.nombre,sub:partes.join(' · '),valor:p.sku||p.nombre};
        }),
        verTodos:{texto:'Ver los '+productos.length+' productos',valor:original,accion:'lista'}
      });
    }

    // 6. Pantallas de la app (las pasa el panel)
    const pantallas=(opciones.pantallas||[]).map(function(p){
      const hay=norm(p.titulo+' '+(p.claves||''));
      const tokens=q.split(' ').filter(Boolean);
      let ok=true;
      for(let i=0;i<tokens.length;i++){if(hay.indexOf(tokens[i])<0){ok=false;break}}
      return ok?p:null;
    }).filter(Boolean);
    if(pantallas.length){
      salida.secciones.push({
        id:'pantallas',titulo:'Pantallas',icono:'chart',tono:'c1',total:pantallas.length,
        items:pantallas.slice(0,MAX_POR_SECCION).map(function(p){
          return {tipo:'pantalla',titulo:p.titulo,sub:p.sub||'Ir a esta pantalla',ir:p.ir};
        })
      });
    }

    salida.total=salida.secciones.reduce(function(n,s){return n+s.total},0);
    return salida;
  }

  /* ---------- ir a cada resultado ---------- */
  function abrirUsuariosFiltrado(valor){
    if(typeof window.showView==='function')window.showView('view-usuarios');
    setTimeout(function(){
      const input=document.getElementById('usuariosSearch');
      if(!input)return;
      input.value=valor||'';
      try{if(typeof window.aplicarFiltrosU==='function')window.aplicarFiltrosU();else input.dispatchEvent(new Event('input',{bubbles:true}))}
      catch(e){input.dispatchEvent(new Event('input',{bubbles:true}))}
      try{input.scrollIntoView({block:'center'})}catch(e){}
    },120);
  }
  function abrirEquipoFiltrado(valor){
    try{if(typeof window.openEquipo==='function')window.openEquipo();else if(typeof window.showView==='function')window.showView('view-equipo')}catch(e){}
    setTimeout(function(){
      // El buscador vive en la solapa «Distribuidores».
      if(!document.getElementById('equipoSearchInput')){
        const solapa=document.querySelector('[data-eqtab="lista"]');
        if(solapa)try{solapa.click()}catch(e){}
      }
      setTimeout(function(){
        const input=document.getElementById('equipoSearchInput');
        if(!input)return;
        input.value=valor||'';
        input.dispatchEvent(new Event('input',{bubbles:true}));
        try{input.scrollIntoView({block:'center'})}catch(e){}
      },180);
    },200);
  }
  function abrirListaFiltrada(valor){
    try{if(typeof window.openLista==='function')window.openLista()}catch(e){}
    setTimeout(function(){
      const input=document.getElementById('lpSearch');
      if(!input)return;
      input.value=valor||'';
      input.dispatchEvent(new Event('input',{bubbles:true}));
    },300);
  }
  function abrirContactoFiltrado(valor){
    try{if(typeof window.openMiGestion==='function')window.openMiGestion()}catch(e){}
    setTimeout(function(){
      const input=document.getElementById('gestionSearch');
      if(!input)return;
      input.value=valor||'';
      input.dispatchEvent(new Event('input',{bubbles:true}));
    },220);
  }
  function ir(item){
    if(!item)return false;
    try{
      if(item.tipo==='usuario'){abrirUsuariosFiltrado(item.valor);return true}
      if(item.tipo==='serie'){abrirUsuariosFiltrado(item.valor);return true}
      if(item.tipo==='distribuidor'){abrirEquipoFiltrado(item.valor);return true}
      if(item.tipo==='contacto'){
        // Abre el Panel con la ficha de la persona ya a la vista.
        if(window.APPIGestion&&typeof window.APPIGestion.abrirContacto==='function'){
          try{window.APPIGestion.abrirContacto(item.id)}catch(e){console.error(e)}
          return true;
        }
        abrirContactoFiltrado(item.titulo);
        return true;
      }
      if(item.tipo==='producto'){abrirListaFiltrada(item.valor);return true}
      if(item.tipo==='pantalla'&&typeof item.ir==='function'){item.ir();return true}
    }catch(e){console.error('Appi buscar',e)}
    return false;
  }
  function irATodos(seccion){
    if(!seccion||!seccion.verTodos)return false;
    const v=seccion.verTodos.valor;
    if(seccion.verTodos.accion==='usuarios'){abrirUsuariosFiltrado(v);return true}
    if(seccion.verTodos.accion==='equipo'){abrirEquipoFiltrado(v);return true}
    if(seccion.verTodos.accion==='contactos'){abrirContactoFiltrado(v);return true}
    if(seccion.verTodos.accion==='lista'){abrirListaFiltrada(v);return true}
    return false;
  }

  window.APPIBuscar={
    buscar:buscar,ir:ir,irATodos:irATodos,norm:norm,alnum:alnum,
    /* para pruebas y para saber si hay datos cargados */
    fuentes:function(){
      return {
        usuarios:listaUsuarios().length,
        distribuidores:listaEquipo().length,
        contactos:listaContactos().length,
        productos:(function(){try{return window.APPILista?window.APPILista.productos().length:0}catch(e){return 0}})()
      };
    }
  };
})();
