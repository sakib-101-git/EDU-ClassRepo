package com.edu.classrepo.exception;

import java.util.List;

public class RoutineParseException extends RuntimeException {
    private final List<String> errors;

    public RoutineParseException(List<String> errors) {
        super("Routine file parsing failed with " + errors.size() + " error(s)");
        this.errors = errors;
    }

    public List<String> getErrors() {
        return errors;
    }
}
