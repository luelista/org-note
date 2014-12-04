<?php

require "config.inc.php";


if ($_GET["authorization"] != "$username:$password") {
   header("HTTP/1.1 401 Not authorized");
   echo "not authorized";
   exit;
}

switch ( $_GET["method"] ) {
case "files":
     $files = array();

     $dh = opendir($note_path);
     while (($f = readdir($dh))) {
           if (preg_match('#\.org$#', $f))
              $files[] = $f;
     }

     echo json_encode($files);
     break;

case "all_files":
     $output = array();

     $dh = opendir($note_path);
     while (($f = readdir($dh))) {
           if (preg_match('#\.org$#', $f))
              $output[$f] = file_get_contents($note_path.'/'.$f);
     }

     echo json_encode($output);
     break;

case "check":
     echo "ok";
     break;
     
}