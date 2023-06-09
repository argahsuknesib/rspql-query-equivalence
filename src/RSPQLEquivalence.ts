import {ParsedQuery} from "./parser/ParsedQuery";
import {parse} from "./parser/RSPQLParser";
import {DataFactory, Quad} from "rdf-data-factory";
// import {BlankNode} from "n3";
const factory = new DataFactory();
import {isomorphic} from "rdf-isomorphic";

const sparqlParser = require('sparqljs').Parser;
const SPARQLParser = new sparqlParser();

export function is_equivalent(query_one: string, query_two: string): boolean {

    let query_one_parsed = parse(query_one);
    let query_two_parsed = parse(query_two);
    if (check_projection_variables(query_one_parsed.projection_variables, query_two_parsed.projection_variables)) {
        if (check_if_stream_parameters_are_equal(query_one_parsed, query_two_parsed) && check_if_window_name_are_equal(query_one_parsed, query_two_parsed)) {
            let query_one_bgp = generate_bgp_quads_from_query(query_one_parsed.sparql);
            let query_two_bgp = generate_bgp_quads_from_query(query_two_parsed.sparql);
            return check_if_queries_are_isomorphic(query_one_bgp, query_two_bgp);
        }
    }
    return false;
}

function check_if_stream_parameters_are_equal(query_one_parsed: ParsedQuery, query_two_parsed: ParsedQuery) {
    return (query_one_parsed.s2r[0].stream_name === query_two_parsed.s2r[0].stream_name && query_one_parsed.s2r[0].width === query_two_parsed.s2r[0].width && query_one_parsed.s2r[0].slide === query_two_parsed.s2r[0].slide);
}

function check_if_window_name_are_equal(query_one_parsed: ParsedQuery, query_two_parsed: ParsedQuery) {
    return (query_one_parsed.s2r[0].window_name === query_two_parsed.s2r[0].window_name);
}

function generate_bgp_quads_from_query(query: string) {
    let sparql_parsed = SPARQLParser.parse(query);
    let basic_graph_pattern = sparql_parsed.where[0].patterns[0].triples;
    return convert_to_graph(basic_graph_pattern);
}

function convert_to_graph(basic_graph_pattern: any) {
    let graph: Quad[] = [];
    for (let i = 0; i < basic_graph_pattern.length; i++) {
        let subject = basic_graph_pattern[i].subject;
        let predicate = basic_graph_pattern[i].predicate;
        let object = basic_graph_pattern[i].object;
        if (subject.termType === 'Variable') {
            subject = factory.blankNode(subject.value);
        }
        if (object.termType === 'Variable') {
            object = factory.blankNode(object.value);
        }
        if (predicate.termType === 'Variable') {
            predicate = factory.blankNode(predicate.value);
        }
        let quad = new DataFactory().quad(subject, predicate, object);
        graph.push(quad);
    }
    return graph;
}

function check_projection_variables(query_one_projection_variables: Array<string>, query_two_projection_variables: Array<string>) {
    for (let i = 0; i < query_one_projection_variables.length; i++) {
        return query_two_projection_variables.includes(query_one_projection_variables[i]);
    }

}

function check_if_queries_are_isomorphic(query_one: Quad[], query_two: Quad[]) {
    return isomorphic(query_one, query_two);
}
