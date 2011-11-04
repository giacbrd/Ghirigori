<?php

/**
 * Ghirigori - draw and animate objects over web pages.
 * Copyright (C) 2011 Giacomo Berardi
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


if ($_POST["save"]) {save($_POST["save"]);}
if ($_POST["load"]) {echo load($_POST["load"]);}
if ($_POST["list"]) {echo get_list();}

function save($model) {
    $e = explode("=", $model);
    $list = array();
    $list = unserialize(file_get_contents("list"));
    if ($e[1] != "") {
        $list[$e[0]] = $e[1];
    } else {
        unset($list[$e[0]]);
    }
    file_put_contents("list", serialize($list));
}

function load($name) {
    $list = array();
    $list = unserialize(file_get_contents("list"));
    return $list[$name];
}

function get_list() {
    $list = array();
    $list = unserialize(file_get_contents("list"));
    $list = implode("\",\"", array_keys($list));
    return ($list == "") ? "" : "[\"".$list."\"]";
}

?>
